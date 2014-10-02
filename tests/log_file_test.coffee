helpers = require "./helpers"
fs = require 'fs'
should = require('chai').Should()
server = ""
client = ""


describe "Log File", ->

    before helpers.cleanApp 
    before (done) =>
        @timeout 100000
        helpers.startApp (appli) =>
            server = appli
            client = helpers.getClient()
            done()
    after (done) =>
        @timeout 20000
        helpers.stopApp server, done

    describe "Log file creation", ->

        it "When I install data-system", (done) ->
            @timeout 500000
            app = 
                name: "data-system"
                repository:
                    url: "https://github.com/cozy/cozy-data-system.git"
                    type: "git"
                scripts:
                    start: "server.coffee"
            client.post 'apps/data-system/install', "start":app, (err, res, body) =>
                @res = res
                @port = body.port
                dsPort = @port
                done()

        it "Then statusCode should be 200", ->
            @res.statusCode.should.equal 200

        it "And file log has been created (/var/log/cozy/data-system.log)", ->
            fs.existsSync('/var/log/cozy/data-system.log').should.be.ok

        it "And file log has been created (/var/log/cozy/data-system.err)", ->
            fs.existsSync('/var/log/cozy/data-system.err').should.be.ok

    describe "Backup log file ", ->

        it "When I restart data-system", (done) ->
            @timeout 100000
            app = 
                name: "data-system"
                repository:
                    url: "https://github.com/cozy/cozy-data-system.git"
                    type: "git"
                scripts:
                    start: "server.coffee"
            client.post 'apps/data-system/stop', "stop":app, (err, res, body) =>
                client.post 'apps/data-system/start', "start":app, (err, res, body) =>
                    @res = res
                    done()

        it "Then statusCode should be 200", ->
            @res.statusCode.should.equal 200

        it "And file log has been created (/var/log/cozy/data-system.log-backup)", ->
            fs.existsSync('/var/log/cozy/data-system.log-backup').should.be.ok

        it "And file log has been created (/var/log/cozy/data-system.err-backup)", ->
            fs.existsSync('/var/log/cozy/data-system.err-backup').should.be.ok

    describe "Remove log file ", ->

        it "When I uninstall data-system", (done) ->
            @timeout 100000
            app = 
                name: "data-system"
                repository:
                    url: "https://github.com/cozy/cozy-data-system.git"
                    type: "git"
                scripts:
                    start: "server.coffee"
            client.post 'apps/data-system/uninstall', app, (err, res, body) =>
                @res = res
                done()

        it "Then statusCode should be 200", ->
            @res.statusCode.should.equal 200

        it "And file log has been removed (/var/log/cozy/data-system.log)", ->
            fs.existsSync('/var/log/cozy/data-system.log').should.be.not.ok

        it "And file log has been removed (/var/log/cozy/data-system.err)", ->
            fs.existsSync('/var/log/cozy/data-system.err').should.be.not.ok

        it "And file log has been removed (/var/log/cozy/data-system.log-backup)", ->
            fs.existsSync('/var/log/cozy/data-system.log-backup').should.be.not.ok

        it "And file log has been removed (/var/log/cozy/data-system.err-backup)", ->
            fs.existsSync('/var/log/cozy/data-system.err-backup').should.be.not.ok