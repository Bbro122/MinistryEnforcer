timeouts = []
let fs = require('fs')
exports.give = function giveXP(msg,amount,check) {
    function give() {
        let data = exports.get()
        let user = data.users.find(user => user.id == msg.author.id)
        if (user) {
            user.xp = user.xp + amount
            if (user.xp >= exports.level(user.level)) {
                user.level++
                msg.channel.send(`**Level Up! You\'re now level ${user.level}.** \n ${exports.level(user.level) - user.xp} xp is needed for your next level.`)
            }
    
            exports.write(data)
            if (check) {
            exports.timeout(msg.author.id)
            }
        } else {
            user = {id:msg.author.id,xp:Math.round(Math.random() * 10) + 15,level:0}
            data.users.push(user)
            exports.write(data)
            if (check) {
            exports.timeout(msg.author.id)
            }
        }
    }
    if (check) {if (timeouts.find(timeout => timeout.id == msg.author.id) == undefined) {give()}} else {give()}
}
exports.write = function write(file) {
    if (file.name == 'users') {fs.writeFileSync('./userdata.json',JSON.stringify(file))}
}
exports.get = function read() {
    return require("./userdata.json")
}
exports.level = function level(lvl) {
    return (5 * (lvl**2) + (50 * lvl) + 100)
}
exports.timeout = function createTimeout(id,time) {
    let timeout = {}
    if (time) {
	timeout = {id:id,timeout:setTimeout(() => timeouts.splice(timeouts.findIndex(timet => timet.timeout == timeout),1),time)}
    } else {
	timeout = {id:id,timeout:setTimeout(() => timeouts.splice(timeouts.findIndex(timet => timet.timeout == timeout),1),60000)}  
    }
    timeouts.push(timeout)
}