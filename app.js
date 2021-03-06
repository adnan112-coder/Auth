//jshint esversion:6
require('dotenv').config()
const express = require("express")
const ejs = require("ejs")
const bodyParser = require("body-parser")
const mongoose = require("mongoose")
const session = require("express-session")
const passport = require("passport")
const passportLocalMongoose = require("passport-local-mongoose") 

const app = express()

app.use(express.static("public"))
app.set('view engine', 'ejs')
app.use(bodyParser.urlencoded({extended: true}))

app.use(session({
    secret: "Little Secret is here",
    resave: false,
    saveUninitialized: false
}))

app.use(passport.initialize())
app.use(passport.session())

mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true})

const userSchema = new mongoose.Schema ({
    email: String,
    password: String,
    secret: String
})

userSchema.plugin(passportLocalMongoose)


const User = mongoose.model("user", userSchema)

passport.use(User.createStrategy())

passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())


app.route("/",)
.get(function(req, res){
    res.render("home")
})



app.route("/login")
.get(function(req, res){
    res.render("login")
})
.post(function(req, res){
    const user = new User({
        username: req.body.username,
        password: req.body.password
    })

    req.login(user, function(err){
        if(err){
            console.log(err)
        }else{
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets")
            })
        }
    })

})


app.route("/secrets")
.get(function(req, res){
    User.find({"secret": {$ne: null}}, function(err, foundUsers){
        if(err){
            console.log(err)
        }else{
            if(foundUsers){
                res.render("secrets", {usersWithSecrets: foundUsers})
            }
        }
    })
})

app.get("/logout", function(req, res){
    req.logout()
    res.redirect("/")
})

app.route("/submit")
.get(function(req, res){
     if(req.isAuthenticated()){
        res.render("submit")
    }else{
        res.redirect("/login")
    }
})
.post(function(req, res){
    const submittedSecret = req.body.secret

    User.findById(req.user.id, function(err, foundUser){
        if(err){
            console.log(err)
        }else{
            if(foundUser){
                foundUser.secret = submittedSecret
                foundUser.save(function(){
                    res.redirect("/secrets")
                })
            }
        }
    })
})


app.route("/register")
.get(function(req, res){
    res.render("register")
})
.post(function(req, res){

    User.register({username: req.body.username}, req.body.password, function(err, user){
        if(err){
            consoel.log(err)
            res.redirect("/register")
        }else{
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets")
            })
        }
    })

})




app.listen(3000, function(){
    console.log("Server successfully launched on port 3000")
})