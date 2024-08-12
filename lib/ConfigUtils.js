const fs = require('node:fs');
const path = require('node:path');

guildConfigs = [];
const dataFolder = "./data";

module.exports = {
    getGuildConfigFilePath: function (guildId)
    {
        const guildFilePathFormat = `${dataFolder}/##GUILDID##.json`;
        return guildFilePathFormat.replace('##GUILDID##', guildId);
    },

    getGuildConfig: function (guildId)
    {
        const guildConfigFromCache = guildConfigs[guildId];
        if (guildConfigFromCache)
        {
            console.log(`Found cached guild config for guild id ${guildId}`);
            return guildConfigFromCache;
        }
        const guildConfigFile = this.getGuildConfigFilePath(guildId);
        if (fs.existsSync(guildConfigFile))
        {
            console.log(`Found guild config on disk for guild id ${guildId}`);
            return JSON.parse(fs.readFileSync(guildConfigFile));
        }
        else
        {
            console.log(`Creating empty guild config for guild id ${guildId}`);
            return [];
        }
    },

    saveGuildConfig: function (guildConfig, guildId)
    {
        this.cacheGuildConfig(guildConfig, guildId);
        try
        {
            const configFilePath = this.getGuildConfigFilePath(guildId);
            console.log(`Writing file for guildId: ${configFilePath}`);
            fs.writeFileSync(configFilePath, JSON.stringify(guildConfig));
        }
        catch (e)
        {
            console.log(`Error: ${e}`);
        }
        return;
    },

    cacheGuildConfig: function (guildConfig, guildId)
    {
        guildConfigs[guildId] = guildConfig;
    }
};
