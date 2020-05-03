import { assert, expect } from 'chai'
import { describe, it } from 'mocha'
import * as url from '../src/url'

describe('isValidUrl', () => {
  it('is valid url', () => {
    var result = url.isValidUrl('https://google.com')
    expect(result).to.equal(true)
  })
  it('is invalid url', async () => {
    expect(() => url.isValidUrl('abc')).to.throw()
  })
})

describe('getHttpStatus', () => {
  it('google = 200', async () => {
    var result = await url.getHttpStatus('https://google.com')
    expect(result).to.equal(200)
  })
  it('internal server error = 500', async () => {
    var result = await url.getHttpStatus('https://httpstat.us/500')
    expect(result).to.equal(500)
  })
  it('not found = 404', async () => {
    var result = await url.getHttpStatus('https://httpstat.us/404')
    expect(result).to.equal(404)
  })
})

describe('urlChecker', () => {
  it('checks valid urls', async () => {
    var results = await url.urlChecker(['https://google.com', 'https://httpstat.us/500'])
    assert.isArray(results)
  })
})
