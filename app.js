const http = require('http')
const cheerio = require('cheerio')
const fs = require('fs')
const print = console.log.bind()
const mailer = require('./mailer')
const users = require('./user.json')

const run = (gen) => {
    const g = gen()
    let next = (data) => {
        let result = g.next(data)
        if (result.done) return;
        result.value.then((data) => {
            next(data)
        })
    }
    next()
}

const host = 'jwc.hit.edu.cn'
const DB = require('path').resolve(__dirname, 'db.json')

const mainPage = () => {
    return new Promise((res, rej) => {
        http.get('http://' + host, (response) => {
            let data = ''
            response.on('data', (chunk) => data += chunk)
            response.on('end', () => {
                res(data)
            })
        })
    })
}

const detailPage = (url) => {
    return new Promise((res, rej) => {
        http.get(url, (response) => {
            let data = ''
            response.on('data', (chunk) => data += chunk)
            response.on('end', () => {
                res(data)
            })
        })
    })
}

const parseList = (data) => {
    let $ = cheerio.load(data)
    let newsList = $(".mc .news_list .news_title a").get()
    let newsListArr = []
    for (let i of newsList) {
        newsListArr.push({
            href: `${host}/${i.attribs.href}`,
            title: i.attribs.title
        })
    }
    return newsListArr.reverse()
}

const updateFile = (newsList) => {
    // let fileList = JSON.parse(fs.readFileSync(DB))
    let fileList = []
    let hash = {}
    let next = []
    for (let i of fileList) {
        hash[i.title] = true
    }
    for (let i of newsList) {
        if (!hash[i.title]) {
            next.push(i)
            fileList.push(i)
        }
    }
    fs.writeFile(DB, JSON.stringify(fileList, null, 4), (err) => {
        if (err) print(err)
    })
    return next
}

const mail = (next) => {
    run(function *() {
        for (let i of next) {
            let page = yield detailPage(`http://${i.href}`)
            let $ = cheerio.load(page)
            let newsDetail = $(".wp_articlecontent")
            let ss = newsDetail.html()
            mailer.sendData(i.title, ss, users)
        }
    })
}

run(function *() {
    const data = yield mainPage()
    let newsList = parseList(data)
    let next = updateFile(newsList)
    setInterval(mail.bind(null, next), 1000 * 60 * 60 * 3)
})

