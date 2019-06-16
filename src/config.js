import path from 'path'
import fs from 'fs'
import jsonfile from 'jsonfile'
import electron from 'electron'

class Config {
    constructor() {
        this.path = path.resolve((electron.app || electron.remote.app).getPath('userData'), 'config.json')
        this.config = null;
        this._init()
    }

    _init() {
        this.config = fs.existsSync(this.path) ? jsonfile.readFileSync(this.path) : {}
    }

    get(key, defaultValue) {
        return this.config.hasOwnProperty(key) ? this.config[key] : defaultValue
    }

    set(key, value) {
        this.config[key] = value

        jsonfile.writeFileSync(this.path, this.config)
    }
}

export let config = new Config()
