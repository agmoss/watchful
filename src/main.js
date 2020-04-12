import axios from 'axios'


async function getHttpStatus(url) {
    try {
        const response = await axios.get(url);
        return response.status
    } catch (error) {
        if (error.response) {
            console.log(error.response.data);
            console.log(error.response.status);
            console.log(error.response.headers);
            return error.response.status;
        }
    }
}

async function urlChecker(urls) {
    const promises = urls.map(async url => {
        const status = await getHttpStatus(url);
        return [url, status]
    })
    const results = await Promise.all(promises);
    return results;
}

export default urlChecker;