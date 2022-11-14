const {Telegraf} = require('telegraf');
const {token,vktoken} = require('./config.json')
const bot = new Telegraf(token);
const path = require("path");
const fs = require("fs");
const axios = require('axios')
const download = require('download')

bot.launch();
bot.on('text', async ctx => {
    let users = ctx.message.text
    if(users.includes('(',')')){
        users = users.replaceAll(',', '')
            .replaceAll('https://vk.com/','')
            .replaceAll('\n', ' ')
            .replaceAll('@', '')
            .split(' ')
            .map(user=> user.slice(1,user.indexOf(')')))
            .filter(user => user.length > 3 && !(/^[а-яё]+$/iu.test(user)) && user.slice(0,2) == 'id')
    }else{
        users = users.replaceAll(',', '')
            .replaceAll('https://vk.com/','')
            .replaceAll('\n', ' ')
            .replaceAll('@', '')
            .split(' ')
            .filter(user => user.length > 3)
    }
    const limit = 100
    if(users.length > limit){
        global.message.push({
            callback: async () => {
                ctx.reply(`вы превысили ограничение в ${limit} юзернеймов, сейчас: ${users.length} | you have exceeded the limit of ${limit} usernames, now: ${users.length}`)
            }
        })
    }else{
        let text = ''
        await axios.get(`https://api.vk.com/method/users.get?user_ids=${users.join()}&fields=city,domain&access_token=${vktoken}&v=5.131`).then(res=>{
            res.data.response.forEach(user=>{
                console.log(user)
                text+=`id${user.id}|${user.city ? user.city.title : '-'}\n`
            })
            // console.log(users.length,res.data.response.length)
            if(text.length>0){
                global.message.push({
                    callback: async () => {
                        ctx.reply(text)
                    }
                })
            }else{
                global.message.push({
                    callback: async () => {
                        ctx.reply('возникла ошибка, проверьте правильность написания id')
                    }
                })
            }
        }).catch(err=>{
            global.message.push({
                callback: async () => {
                    ctx.reply('возникла ошибка, проверьте правильность написания id')
                }
            })
        })
    }
})
bot.on('document', async ctx => {
    let filepath = (await ctx.telegram.getFile(ctx.message.document.file_id)).file_path
    download(`https://api.telegram.org/file/bot${token}/${filepath}`, path.join(__dirname, './tmp')).then(async res => {
        if (filepath.split('/')[1].split('.')[filepath.split('/')[1].split('.').length - 1] == 'txt') {
            fs.readFile(path.join(__dirname, 'tmp', filepath.split('/')[1]), {encoding: 'utf-8'}, async function (err, data) {
                if (!err) {
                    let users = data
                    if(users.includes('(',')')){
                        users = users.replaceAll(',', '')
                            .replaceAll('https://vk.com/','')
                            .replaceAll('\n', ' ')
                            .replaceAll('@', '')
                            .split(' ')
                            .map(user=> user.slice(1,user.indexOf(')')))
                            .filter(user => user.length > 3 && !(/^[а-яё]+$/iu.test(user)) && user.slice(0,2) == 'id')
                    }else{
                        users = users.replaceAll(',', '')
                            .replaceAll('https://vk.com/','')
                            .replaceAll('\n', ' ')
                            .replaceAll('@', '')
                            .split(' ')
                            .filter(user => user.length > 3)
                    }
                    const limit = 1000
                    if(users.length > limit){
                        global.message.push({
                            callback: async () => {
                                ctx.reply(`вы превысили ограничение в ${limit} юзернеймов, сейчас: ${users.length} | you have exceeded the limit of ${limit} usernames, now: ${users.length}`)
                            }
                        })
                    }else{
                        let text = ''
                        await axios.get(`https://api.vk.com/method/users.get?user_ids=${users.join()}&fields=city,domain&access_token=${vktoken}&v=5.131`).then(res=>{
                            res.data.response.forEach(user=>{
                                // console.log(user)
                                text+=`id${user.id}|${user.city ? user.city.title : '-'}\n`
                            })
                            fs.writeFile(path.join(__dirname, 'tmp', `ready_${filepath.split('/')[1]}`), text, (err, res) => {
                                if (err) {
                                    console.log(err)
                                    global.message.push({
                                        callback: async () => {
                                            ctx.reply('возникла ошибка, с созданием файла')
                                        }
                                    })
                                }else{
                                    if(text.length>0){
                                        global.message.push({
                                            callback: async () => {
                                                ctx.replyWithDocument({source: path.join(__dirname, 'tmp', `ready_${filepath.split('/')[1]}`)}).then(() => {
                                                    fs.unlink(path.join(__dirname, 'tmp', filepath.split('/')[1]), function (err) {
                                                        if (err) return console.log(err);
                                                    });
                                                    fs.unlink(path.join(__dirname, 'tmp', `ready_${filepath.split('/')[1]}`), function (err) {
                                                        if (err) return console.log(err);
                                                    });
                                                })
                                            }
                                        })
                                    }else{
                                        global.message.push({
                                            callback: async () => {
                                                ctx.reply('возникла ошибка, проверьте правильность написания id')
                                            }
                                        })
                                    }
                                }
                            });
                        }).catch(err=>{
                            global.message.push({
                                callback: async () => {
                                    ctx.reply('возникла ошибка, проверьте правильность написания id')
                                }
                            })
                        })
                    }
                } else {
                    console.log(err);
                }
            });
        } else {
            global.message.push({
                callback: async () => {
                    ctx.reply('файл должен быть в формате .txt | the file must be in the format .txt')
                }
            })
            fs.unlink(path.join(__dirname, 'tmp', filepath.split('/')[1]), function (err) {
                if (err) return console.log(err);
            });
        }
    })
})
global.message = []
let currentMessage = null;
setInterval(() => {
    if (global.message.length > 0 && currentMessage == null && global.message[0]) {
        currentMessage = global.message[0]
        try {
            currentMessage.callback().then(res => {
                console.log('отправлено')
                global.message.splice(global.message.indexOf(currentMessage), 1)
                currentMessage = null
            })
        } catch (e) {
            console.log(e)
            currentMessage = null
        }
    }
}, 50)