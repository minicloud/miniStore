var crypto = require('crypto')
var fs = require('fs')
var path = require('path')
    /**
     * return random number
     * @param {Integer} Min 
     * @param {Integer} Max 
     * @return {Integer}
     * @api private
     */
var _getRandomNum = function(Min, Max) {
        var Range = Max - Min
        var Rand = Math.random()
        return (Min + Math.round(Rand * Range))
    }
    /**
     * block path append to aimPath 
     * @param {Array} zonePathList 
     * @param {String} signature 
     * @return {String}
     * @api private
     */
var _merge = function(aimPath, blockPath) {
        return function(done) {
            var writeStream = fs.createWriteStream(aimPath, {
                'flags': 'a'
            })
            var readStream = fs.createReadStream(blockPath)
            readStream.pipe(writeStream)
            readStream.on('end', function() {
                return done(null, true)
            })
        }
    }
    /**
     * return file save path
     * @param {Array} pathList 
     * @param {String} signature 
     * @return {String}
     * @api private
     */
var getFileSavePath = function(pathList, signature) {
        var pos = _getRandomNum(0, pathList.length - 1)
        var subPath = pathList[pos]
        return _getFileContentPath(subPath, signature)
    }
    /**
     * find signature file
     * @param {Array} zonePathList 
     * @param {String} signature 
     * @return {String}
     * @api private
     */
var find = function*(zonePathList, signature) {
        for (var i = 0; i < zonePathList.length; i++) {
            var rootPath = zonePathList[i]
            var maybePath = _getFileContentPath(rootPath, signature) 
            if (fs.existsSync(maybePath)) { 
                //Compatible miniyun 1.5
                var stat = fs.statSync(maybePath)
                if (stat.isDirectory()) {
                    var newFilePath = path.join(maybePath, 'new_' + signature)
                    if (!fs.existsSync(newFilePath)) { 
                        //merge subfiles to newFilePath
                        var subFiles = fs.readdirSync(maybePath)
                        for (var j = 0; j < subFiles.length; j++) {
                            var blockFileName = subFiles[j] 
                            if (blockFileName.indexOf(signature) === 0) {
                                var blockFilePath = path.join(maybePath, blockFileName)
                                yield _merge(newFilePath, blockFilePath)
                            }
                        }
                    }
                    return newFilePath
                }
                return maybePath
            }
        }
        return false
    }
    /**
     * return file save path
     * @param {String} rootPath 
     * @param {String} signature 
     * @return {String}
     * @api private
     */
var _getFileContentPath = function(rootPath, signature) {
        var sub1 = signature.substring(0, 2)
        var sub2 = signature.substring(2, 4)
        var sub3 = signature.substring(4, 6)
        var sub4 = signature.substring(6, 8)
        return path.join(rootPath, sub1, sub2, sub3, sub4, signature)
    }
    /**
     * return file content sha1
     * @param {String} filePath  
     * @return {String}
     * @api private
     */
var getFileSha1 = function(filePath) {
    return function(done) {
        var shasum = crypto.createHash('sha1')
        var stream = fs.ReadStream(filePath)
        stream.on('data', function(d) {
            shasum.update(d)
        })
        stream.on('end', function() {
            var signature = shasum.digest('hex')
            return done(null, signature)
        })
    }
}
exports.getFileSha1 = getFileSha1
exports.find = find
exports.getFileSavePath = getFileSavePath