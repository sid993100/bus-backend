class ConsoleManager {
    log(data) {
        const env = process.env.NODE_ENV;
        switch (env) {
            case 'dev':
                console.log(data);
                break;
            case 'prod':
                break;
            case 'stagging':
                break;
            default:
                break;
        }
    }
    error(data) {
        const env = process.env.NODE_ENV;
        switch (env) {
            case 'dev':
                console.error(data);
                break;
            case 'prod':
                break;
            case 'stagging':
                break;
            default:
                break;
        }
    }
}

module.exports = new ConsoleManager();