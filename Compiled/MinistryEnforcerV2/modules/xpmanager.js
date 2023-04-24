"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dataManager = require('./datamanager');
let globalMultiplier = 1;
let activeMultipliers = [];
exports.setup = function () {
    //let data = dataManager.getXPData()
    let servers = dataManager.listServers();
    servers.forEach(server => {
        let data = dataManager.getXPData(server);
        data.multipliers.forEach(multiplier => {
            if (multiplier.endTime) {
                if ((multiplier.endTime - Date.now()) > 0)
                    activeMultipliers.push({ timeout: setTimeout(() => { exports.removeMultiplier(multiplier.startTime); }, multiplier.endTime - Date.now()) });
                else {
                    exports.removeMultiplier();
                }
            }
        });
    });
};
exports.addMultiplier = function (multiplier, serverID, time) {
    if (time && time > 0 && serverID) {
        let data = dataManager.getXPData(serverID);
        data.multipliers.push({ startTime: Date.now(), endTime: Date.now() + time, multiplier: multiplier });
    }
};
exports.levelRequirement = function levReq(lvl) {
    return (5 * (lvl ** 2) + (50 * lvl) + 100);
};
exports.getLevel = function getLevel(xp) {
    let level = 0;
    do {
        level++;
    } while (xp >= exports.levelRequirement(level));
    return level;
};
exports.getXP = function (serverID, userID) {
    let data = dataManager.getXPData(serverID);
    let user = data.users.find(user => user.id == userID);
    if (user) {
        return user.xp;
    }
    else {
        return 0;
    }
};
exports.addXP = function (serverID, userID, xp, global) {
    let data = dataManager.getXPData(serverID);
    let user = data.users.find(user => user.id == userID);
    if (user) {
        user.xp = user.xp + xp;
    }
    else {
        user = { id: userID, xp: xp };
    }
    dataManager.writeFile(`../data/serverdata/${serverID}/userData.json`, JSON.stringify(data));
    data = dataManager.getGlobalXPData();
    user = data.users.find(user => user.id == userID);
    if (user) {
        user.xp = user.xp + xp;
    }
    else {
        user = { id: userID, xp: xp };
    }
    return user.xp;
};
exports.setXP = function (serverID, userID, xp) {
    let data = dataManager.getXPData(serverID);
    let user = data.users.find(user => user.id == userID);
    if (user) {
        user.xp = xp;
    }
    else {
        user = { id: userID, xp: xp };
    }
    dataManager.writeFile(`../data/serverdata/${serverID}/userData.json`, JSON.stringify(data));
    return xp;
};
exports.getUserLevel = function (serverID, userID) {
    let data = dataManager.getXPData(serverID);
    let user = data.users.find(user => user.id == userID);
    let xp = 0;
    if (user) {
        xp = user.xp;
    }
    return exports.getLevel(xp);
};
exports.getRank = function (xp, serverID) {
    let data;
    if (serverID) {
        data = dataManager.getXPData(serverID);
    }
    else {
        data = dataManager.getGlobalXPData();
    }
    let users = data.users;
    let fakeUser = { xp: xp + 1, id: '000' };
    users.push(fakeUser);
    users.sort((a, b) => b.xp - a.xp);
    return users.indexOf(fakeUser) + 1;
};
exports.removeMultiplier = function (startTime, serverID) {
    if (serverID) {
        let data = dataManager.getXPData(serverID);
        let multiplier = data.multipliers.find(multiplier => multiplier.startTime == startTime);
        if (multiplier) {
            data.multipliers.splice(data.multipliers.indexOf(multiplier), 1);
            dataManager.writeFile(`../data/serverdata/${serverID}/userdata.json`, JSON.stringify(data));
        }
    }
};