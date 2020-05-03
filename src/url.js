import axios from 'axios'

export const isValidUrl = (string) => {
  try {
    new URL(string)
  } catch (e) {
    if (string === 'done') {
      return true
    }
    throw new Error('Not a valid url')
  }
  return true
}

export const getHttpStatus = async (url) => {
  try {
    const response = await axios.get(url)
    return response.status
  } catch (error) {
    if (error.response.status) {
      return error.response.status
    } else {
      throw new Error(`Could not get status of: ${url}`)
    }
  }
}

export const urlChecker = async (urls) => {
  try {
    const promises = urls.map(async (url) => {
      const status = await getHttpStatus(url)
      return [url, status]
    })
    const results = await Promise.all(promises)
    return results
  } catch (error) {
    console.log(error.message)
    return process.exit(1)
  }
}
