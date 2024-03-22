import Popstar from "../models/popstar/Popstar.js"
import { toButton, sleep } from "../models/common.js"

const GAME = {}

export class LinkGameLite extends plugin {
    constructor() {
        super({
            name: '轻量版消灭星星',
            dsc: '轻量版消灭星星',
            event: 'message',
            priority: 1,
            rule: [
                {
                    reg: /^[#\/](结束)?消灭星星$/,
                    fnc: 'start'
                },
                {
                    reg: /^\s*消灭\s*\d+\s*$/,
                    fnc: 'popstar'
                },
                // {
                //     reg: /^[#\/]消灭星星第\d排$/,
                //     fnc: 'changeView'
                // }
            ]
        })
    }

    async start(e) {
        if (e.bot.adapter.name != 'QQBot' && !e.bot.config?.markdown) {
            return false
        }
        e.toQQBotMD = true
        if (e.msg.includes('结束')) {
            delete GAME[e.group_id]
            return e.reply(['消灭星星已结束', toButton([[{ text: '开始游戏', callback: '/消灭星星' }]])])
        }
        if (!GAME[e.group_id]) {
            GAME[e.group_id] = new Popstar();
            const game = GAME[e.group_id]
            game.enter()
        }
        const game = GAME[e.group_id]
        game.page = 6
        const buttons = makeButton(game.model.grid, game.page)
        let msg = [
            `消灭星星\t\t关卡: ${game.level + 1}\t\t`,
            `[结束游戏] (mqqapi://aio/inlinecmd?command=${encodeURIComponent('/结束消灭星星')}&reply=false&enter=true)\r`,
            `得分: ${game.total}\t\t\t目标: ${game.constrol.goal}\r\r>此功能比较刷屏,建议拉一个小群玩`, toButton(buttons.splice(0, 5))]
        await e.reply(msg)
        await e.reply(['\u200B', toButton(buttons)])
        return true
    }

    async popstar(e) {
        if (e.bot.adapter.name != 'QQBot' && !e.bot.config?.markdown) {
            return false
        }
        e.toQQBotMD = true
        if (!GAME[e.group_id]) {
            return await e.reply(['消灭星星未开始', toButton([[{ text: '开始游戏', callback: '/消灭星星' }]])])
        }
        const game = GAME[e.group_id]
        const index = +e.msg.replace(/^\s*消灭\s*(\d+)\s*$/, '$1')
        const count = game.model.clean(index)
        game.total += count * count * 5
        const l = count > 0 ? `${count}连消 ${count * count * 5}分` : ''
        const msg = [
            `消灭星星\t\t关卡: ${game.level + 1}\t\t`,
            `[结束游戏] (mqqapi://aio/inlinecmd?command=${encodeURIComponent('/结束消灭星星')}&reply=false&enter=true)\r`,]
        if (game.model.check() === false) {
            const { score, count } = game.model.cleanAll()
            msg.push(`\r本局已结束,剩余${count}个方块`)
            if (score > 0) {
                msg.push(`,获得得分: ${score}`)
                game.total += score
            }
            msg.push(`得分: ${game.total}\t\t\t目标: ${game.constrol.goal}\r${l || ''}`)
            if (game.total >= game.constrol.goal) {
                msg.push(`\r关卡${game.level + 1}以通过,即将进入下一关`)
                await e.reply(msg)
                await sleep(2000)
                msg.length = 0
                msg.push(`消灭星星\t\t关卡: ${game.level + 1}\t\t[结束游戏] (mqqapi://aio/inlinecmd?command=${encodeURIComponent('/结束消灭星星')}&reply=false&enter=true)\r`)
                game.next()
            } else {
                msg.push(`得分低于关卡目标得分,游戏结束!`)
                msg.push(toButton([[{ text: '再来一局', callback: '/消灭星星' }]]))
                delete game[e.group_id]
                return await e.reply(msg)
            }
        } else {
            msg.push(`得分: ${game.total}\t\t\t目标: ${game.constrol.goal}\r${l || ''}`)
        }
        msg.push('\r\r>此功能比较刷屏,建议拉一个小群玩')
        const buttons = makeButton(game.model.grid, game.page)
        msg.push(toButton(buttons.splice(0, 5)))
        await e.reply(msg)
        if (buttons.length) {
            await e.reply(['\u200B', toButton(buttons)])
        }
        return true
    }

    // async changeView(e) {
    //     if (e.bot.adapter.name != 'QQBot' && !e.bot.config?.markdown) {
    //         return false
    //     }
    //     e.toQQBotMD = true
    //     if (!GAME[e.group_id]) {
    //         return
    //     }
    //     const page = +e.msg.replace(/^[#\/]消灭星星第(\d)排$/, '$1')
    //     if (page < 1 || page > 6) {
    //         return
    //     }
    //     const game = GAME[e.group_id]
    //     game.page = page
    //     const buttons = makeButton(game.model.grid, page)
    //     const msg = [
    //         `消灭星星\t\t\t\t`,
    //         `[结束游戏] (mqqapi://aio/inlinecmd?command=${encodeURIComponent('/消灭星星')}&reply=false&enter=true)\r`,
    //         `得分: ${game.total}\r`]
    //     for (let i = 1; i < 7; i++) {
    //         msg.push(`[[显示${i}-${i + 4}排${game.page == i ? '✔' : ''}]] (mqqapi://aio/inlinecmd?command=${encodeURIComponent(`/消灭星星第${i}排`)}&reply=false&enter=true)\t\t`)
    //         if (i % 3 == 0) {
    //             msg.push('\r')
    //         }
    //     }
    //     msg.push(toButton(buttons))
    //     return e.reply(msg)
    // }

}

function makeButton(arr, page = 6, end = false) {
    const buttons = []
    const button = []
    let index = 0
    for (let i = 0; i < arr.length; i++) {
        index++
        const b = {
            text: clrMap[arr[i]?.clr] + '',
            callback: '消灭 ' + arr[i]?.index,
            QQBot : { 
                     render_data: { 
                         style: 1 
                     } 
                 }
        }
        if (!arr[i]) {
            b.text = ' '
            b.QQBot = {
                render_data: {
                    style: 0
                }
            }
            b.permission = 'xxx'
        }
        if (end) {
            b.permission = 'xxx'
        }
        button.push(b)
        if (index % 10 == 0) {
            if (!button.every(a => a.permission)) {
                buttons.push([...button])
            }
            button.length = 0
        }
    }
    return buttons
}

const clrMap = {
    0: '❤',
    1: '🖤',
    2: '💛',
    3: '💚',
    4: '💙',
}