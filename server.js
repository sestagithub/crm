const express = require('express');
const app = express();
const mysql = require('mysql');
var db = require('./db');
var bodyParser = require('body-parser');
var nodemailer = require('nodemailer');
var ejs = require("ejs");
let pdf = require("html-pdf");
const mailer = require("@sendgrid/mail"); 
app.set("view engine","ejs");
const cookieSession = require("cookie-session");
const bcrypt = require("bcrypt");

app.use(express.static(__dirname+ "/public"));

app.use(bodyParser.urlencoded({ extended: false }));
// const authenticateUser = require("./middlewares/authenticateUser");


// parse application/json
// app.use(bodyParser.json())
app.use(bodyParser.json({limit: "50mb"}));
app.use(bodyParser.urlencoded({limit: "50mb", extended: true, parameterLimit:50000}));

app.use(
  cookieSession({
    keys: ["randomStringASyoulikehjudfsajk"],
  })
);

// app.get('/',(req,res)=>)
  


app.get('/login',(req,res)=>{
  res.render('login')
})


app
  .post("/login", async (req, res) => {
    var { email, password } = req.body;

    // check for missing filds
    if (!email || !password) {
      res.send("Please enter all the fields");
      return;
    }
  console.log(email)
  email = String(email);

let sql= `SELECT * FROM user WHERE email ='${email}'`;

let query = db.query(sql, async(err, result) => {
      if(err) throw err;
        console.log( result.length)

        

          if (result.length==0) {
            // res.send("invalid username or password");
            res.redirect("/login");
            // return;
            }


      const doesPasswordMatch = await bcrypt.compare(
      password,
      result[0].password
    );

    if (!doesPasswordMatch) {

      res.redirect("/login");
      // return;
    }

    req.session.user = {
      email,
    };

    res.redirect("/");

      })
  
  });

  app.get("/logout", (req, res) => {
    req.session.user = null;
    res.redirect("/login");
  });

  app.get("/users",  (req, res) => {
    // req.session.user = null;
    let sql = "SELECT * FROM user";
    let query = db.query(sql, async(err, dbresult) => {
        if(err) throw err;
        res.render('users',{dbresult})
  
      }) 
  });





  app.post('/user', async (req,res)=>{
    const {name,email,password} = req.body;
    const hashedPassword = await bcrypt.hash(password, 12);
  
    let post ={name,email,password:hashedPassword}
  
      let sql = 'INSERT INTO user SET ?';      
      let query = db.query(sql, post, (err, result) => {
          if(err) {
              res.json(err.sqlMessage)
          }
          res.redirect('/users')
      })
  })
  
  app.post('/users/delete', (req,res)=>{
  
    const {user_id }=req.body;
    // console.log(donation_id)
  
    let sql = 'DELETE FROM user WHERE id ='+user_id ;      
      let query = db.query(sql, (err, result) => {
          if(err) {
              res.json(err.sqlMessage)
          }
          res.redirect('/users')
      })
  
  })
  
  




///////////////////////////////USER MANAGEMENT///////////////



app.get('/',(req,res)=>{

  let sql = `SELECT SUM(Amount) AS total_amount,COUNT(*) AS total_donor FROM donors LEFT JOIN donations ON donors.donor_id =donations.donor `;
  let query = db.query(sql, async(err, result) => {
      if(err) throw err;

        let sql = `SELECT foreign_donor FROM donors WHERE foreign_donor='Yes' `;
        let query = db.query(sql, async(err, dbresult) => {
        if(err) throw err;

            let sql = `SELECT name,phone,address,SUM(Amount) AS total_amount FROM donations LEFT JOIN donors ON donations.donor = donors.donor_id GROUP BY donations.donor ORDER BY total_amount DESC LIMIT 5 `;
            let query = db.query(sql, async(err, alresult) => {
            if(err) throw err;
          console.log(alresult)
            res.render('dashboard',{result,dbresult,alresult})
    })
    
     
    })
  })

})



/////////////////DONATION////////////////////

app.get('/donations', (req,res)=>{
    let sql = "SELECT * FROM donations INNER JOIN donors ON donations.donor = donors.donor_id";
    let query = db.query(sql, async(err, result) => {
        if(err) throw err;
        let sql = "SELECT * FROM donors";
        let query = db.query(sql, async(err, dbresult) => {
            if(err) throw err;
            res.render('donations',{result,dbresult})
      
          }) 
  
      })  
})


app.post('/donations', (req,res)=>{
  const {amount,currency,donor,date,source,purpose} = req.body;

  let post ={donor,Amount:amount,currency,donation_date:date,source,purpose}

    let sql = 'INSERT INTO donations SET ?';      
    let query = db.query(sql, post, (err, result) => {
        if(err) {
            res.json(err.sqlMessage)
        }
        res.redirect('/donations')
    })
})

app.post('/donations/delete', (req,res)=>{

  const {donation_id }=req.body;
  // console.log(donation_id)

  let sql = 'DELETE FROM donations WHERE donation_id ='+donation_id ;      
    let query = db.query(sql, (err, result) => {
        if(err) {
            res.json(err.sqlMessage)
        }
        res.redirect('/donations')
    })

})






app.post('/donation-receipt', (req,res)=>{
  var {id} = req.body;

  let sql = "SELECT * FROM donations INNER JOIN donors ON donations.donor = donors.donor_id WHERE donation_id ="+id;
  let query = db.query(sql, async(err, result) => {
      if(err) throw err;

      console.log(result)

      var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'sestaho@sesta.org',
          pass: '#adminsesta2011'
        }
      });

      let donation_id = result[0].donation_id;
      let Amount = result[0].Amount;
      let donation_date = result[0].donation_date;
      let name = result[0].name;
      let email = result[0].email;

      ejs.renderFile(__dirname + "/views/donation_receipt.ejs", { donation_id ,Amount,donation_date,name }, function (err, data) {
        if (err) {
            console.log(err);
        } else {
  
              var mailOptions = {
              from: 'sestaho@sesta.org',
              to: email,
              subject: 'Donation Receipt',
              html: data
            };
            transporter.sendMail(mailOptions, function (err, info) {
                if (err) {
                    console.log(err);
                } else {
                  res.redirect('/donations')
                  // var date = new Date();
                  // var month = date.getMonth();
                  // var year = date.getFullYear();
                  // let newDate = `${month}/${year}`;
                  
                  // let post ={user_id:email,date:newDate}
  
                  // let sql = 'INSERT INTO newsletter SET ?';      
                  //  let query = db.query(sql, post, (err, result) => {
                  //      if(err) {
                  //          res.json(err.sqlMessage)
                  //      }
                  //  });
                   
                }
            });
        }
  
  
      })

    })  
  
})





//////BENIFICARY//////////


app.get('/benificary', (req,res)=>{
  let sql = "SELECT benificary_id,beni_address,beni_name,beni_phone,SUM(rcv_amount) AS total_amount,COUNT(*) AS count FROM benificary LEFT JOIN benificary_amount ON benificary.benificary_id = benificary_amount.benificary_ GROUP BY benificary_amount.benificary_ ";
  let query = db.query(sql, async(err, result) => {
      if(err) throw err;
      console.log(result)
      res.render('benificary',{result})

    })
  
})

app.post('/benificary', (req,res)=>{
  const {beni_name,beni_address,beni_phone} = req.body;


  let post ={beni_name,beni_address,beni_phone}

  let sql = 'INSERT INTO benificary SET ?';      
    let query = db.query(sql, post, (err, result) => {
        if(err) {
            res.json(err.sqlMessage)
        }
        res.redirect('/benificary')
    })

})


app.get('/benificary/:id', (req,res)=>{
  let id = req.params.id;
  let sql = `SELECT * FROM benificary LEFT JOIN benificary_amount ON benificary.benificary_id=benificary_amount.benificary_ LEFT JOIN donors ON benificary_amount.donor_=donors.donor_id   WHERE benificary_id =`+id;
  let query = db.query(sql, async(err, result) => {
      if(err) throw err;
      console.log(result)
      // res.render('onebenificary',{result})
      let sql = `SELECT * FROM donors `;
      let query = db.query(sql, async(err, dbresult) => {
          if(err) throw err;
          console.log(result)
          res.render('onebenificary',{result,dbresult})

        })

    })
})

app.post('/beni_donation', (req,res)=>{
  const {rcv_amount,rcv_date,donor_,benificary_} = req.body;


  let post ={rcv_amount,rcv_date,donor_,benificary_}

  let sql = 'INSERT INTO benificary_amount SET ?';      
    let query = db.query(sql, post, (err, result) => {
        if(err) {
            res.json(err.sqlMessage)
        }
        res.redirect('/benificary/'+benificary_)
    })
})

app.post('/benificary/delete', (req,res)=>{

  const {benificary_id  }=req.body;

  let sql = 'DELETE FROM benificary WHERE benificary_id ='+benificary_id  ;      
    let query = db.query(sql, (err, result) => {
        if(err) {
            res.json(err.sqlMessage)
        }
        res.redirect('/benificary')
    })

})


app.post('/beni_donation/delete', (req,res)=>{

  const {ammount_id,benificary_id    }=req.body;
  console.log(benificary_id)
  

  let sql = 'DELETE FROM benificary_amount WHERE ammount_id ='+ammount_id   ;      
    let query = db.query(sql, (err, result) => {
        if(err) {
            res.json(err.sqlMessage)
        }
        res.redirect('/benificary')
    })

})


////////////DONORS///////////////

app.get('/donors', (req,res)=>{
    let sql = `SELECT DISTINCT newsletter_id,donor_id,etohop_date,foreign_donor,name,email,phone,address,date,SUM(Amount) AS total_amount,COUNT(*) AS count FROM donors LEFT JOIN donations ON donors.donor_id = donations.donor  LEFT JOIN newsletter ON donors.donor_id=newsletter.user_id LEFT JOIN etohop ON donors.donor_id=etohop.user_id  GROUP BY donations.donor ORDER BY total_amount DESC `;
    // let sql  = `SELECT donors.name,SUM(Amount) AS total FROM donations LEFT JOIN donors ON donations.donor = donors.donor_id GROUP BY donations.Amount  `;
    let query = db.query(sql, async(err, result) => {
        if(err) throw err;
        console.log(result)
        res.render('donors',{result})
  
      })
   
})

app.post('/donors', (req,res)=>{
  const {name,email,phone,address,assocated_date,foreign_donor} = req.body;

  let post ={name,email,phone,address,assocated_date,foreign_donor}

  let sql = 'INSERT INTO donors SET ?';      
    let query = db.query(sql, post, (err, result) => {
        if(err) {
            res.json(err.sqlMessage)
        }
        res.redirect('/donors')
    })

})

app.post('/donors/delete', (req,res)=>{

  const {donor_id  }=req.body;
  // console.log(donor_id )

  let sql = 'DELETE FROM donors WHERE donor_id  ='+donor_id  ;      
    let query = db.query(sql, (err, result) => {
        if(err) {
            res.json(err.sqlMessage)
        }
        res.redirect('/donors')
    })

})





app.get('/donors/:id', (req,res)=>{
    // console.log(req.params.id)
    var id = req.params.id;
    let sql = `SELECT * FROM donors LEFT JOIN newsletter ON donors.donor_id=newsletter.user_id LEFT JOIN annual_report ON donors.donor_id=annual_report.user_id  LEFT JOIN etohop ON donors.donor_id=etohop.user_id  WHERE donor_id = ${id} ORDER BY newsletter_id DESC`;
    let query = db.query(sql, async(err, result) => {
        if(err) throw err;
        console.log(result)
        let sid = req.params.id.toString();
      
        let sql = `SELECT SUM(Amount) AS amount FROM donations WHERE donor = ${sid} UNION SELECT COUNT(*) AS total FROM donations WHERE donor =  ${sid} `; 
        let query = db.query(sql, async(err, sqlresult) => {
            if(err) throw err;
            // console.log(sqlresult)
            // res.render('donor',{result,sqlresult})
            let sql = `SELECT * FROM donations WHERE donor = ${sid}  `; 
            let query = db.query(sql, async(err, allresult) => {
                if(err) throw err;
                console.log(allresult)
                res.render('donor',{result,sqlresult,allresult})
          
              })
      
          })
  
      })
})

app.post('/newsletter', (req,res)=>{
    var {email,sbuject,body,id,donor_id,email_id} = req.body;

    console.log(body)

    var transporter = nodemailer.createTransport({
        service: 'gmail',
         auth: {
          user: 'sestaho@sesta.org',
          pass: '#adminsesta2011'
        }
      });
      ejs.renderFile(__dirname + "/views/newsletter.ejs", { name: 'Stranger' }, function (err, data) {
        if (err) {
            console.log(err);
        } else {
      
              var mailOptions = {
              from: 'sestaho@sesta.org',
              to: email_id,
              subject: sbuject,
              html: data
            };
            transporter.sendMail(mailOptions, function (err, info) {
                if (err) {
                    console.log(err);
                } else {
                  var date = new Date();
                  var month = date.getMonth();
                  var year = date.getFullYear();
                  let newDate = `${month}/${year}`;
                  
                  let post ={user_id:email,date:newDate}

                  let sql = 'INSERT INTO newsletter SET ?';      
                   let query = db.query(sql, post, (err, result) => {
                       if(err) {
                           res.json(err.sqlMessage)
                       }
                   });
                    // console.log('Message sent: ' + info.response);
                    res.redirect(`/donors/${id}`)
                }
            });
        }


      })
})


app.post('/etohop', (req,res)=>{
  var {email,sbuject,body,id,donor_id} = req.body;

  var transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'dasjay084@gmail.com',
        pass: 'SeSTA@2011'
      }
    });
    ejs.renderFile(__dirname + "/views/etohop.ejs", { name: 'Stranger' }, function (err, data) {
      if (err) {
          console.log(err);
      } else {
    
            var mailOptions = {
            from: 'dasjay084@gmail.com',
            to: 'jayprakash@sesta.org',
            subject: sbuject,
            html: data
          };
          transporter.sendMail(mailOptions, function (err, info) {
              if (err) {
                  console.log(err);
              } else {
                var date = new Date();
                var month = date.getMonth();
                var year = date.getFullYear();
                let newDate = `${month}/${year}`;
                
                let post ={user_id:email,etohop_date:newDate}

                let sql = 'INSERT INTO etohop SET ?';      
                 let query = db.query(sql, post, (err, result) => {
                     if(err) {
                         res.json(err.sqlMessage)
                     }
                 });
                  // console.log('Message sent: ' + info.response);
                  res.redirect(`/donors/${id}`)
              }
          });
      }


    })
})

app.post('/annual-report', (req,res)=>{
  var {email,sbuject,body,id,donor_id} = req.body;

  var transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'dasjay084@gmail.com',
        pass: 'SeSTA@2011'
      }
    });
    ejs.renderFile(__dirname + "/views/annual.ejs", { name: 'Stranger' }, function (err, data) {
      if (err) {
          console.log(err);
      } else {
    
            var mailOptions = {
            from: 'dasjay084@gmail.com',
            to: 'jayprakash@sesta.org',
            subject: sbuject,
            html: data
          };
          transporter.sendMail(mailOptions, function (err, info) {
              if (err) {
                  console.log(err);
              } else {
                var date = new Date();
                var month = date.getMonth();
                var year = date.getFullYear();
                let newDate = `${month}/${year}`;
                
                let post ={user_id:email,annual_date:newDate}

                let sql = 'INSERT INTO annual_report SET ?';      
                 let query = db.query(sql, post, (err, result) => {
                     if(err) {
                         res.json(err.sqlMessage)
                     }
                 });
                  // console.log('Message sent: ' + info.response);
                  res.redirect(`/donors/${id}`)
              }
          });
      }


    })
})


/////////////////DASHBOARD/////////////////














///////CAMPAIGN/////////
app.get('/campaigns', (req,res)=>{

  let sql = 'SELECT * FROM campaigns';      
  let query = db.query(sql, (err, result) => {
  if(err) {
      res.json(err.sqlMessage)
          }
          res.render('campaigns',{result})
      });

})


app.get('/campaign', (req,res)=>{
  res.render('campaign')

})


/////////////BULK SMS.///////////
app.get('/bulk', (req,res)=>{

  let sql = 'SELECT * FROM donors';      
  let query = db.query(sql, (err, result) => {
  if(err) {
      res.json(err.sqlMessage)
          }

      var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'dasjay084@gmail.com',
          pass: 'SeSTA@2011'
        }
      });



          res.render('bulkSMS',{result})
      });

})




app.post('/bulk-newsletter', (req,res)=>{

    var transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'jayprakash@sesta.org',
        pass: 'jayraj9196'
      }
    });


      let sql = 'SELECT * FROM donors';      
      let query = db.query(sql, (err, result) => {
        if(err) {
                  console.log(err.sqlMessage)
                }
                for(let count = 0; count < result.length; count++) {

                ejs.renderFile(__dirname + "/views/etohop.ejs", { name: 'Stranger' }, function (err, data) {
                    if (err) {
                          console.log(err);
                    } else {
                    
                          var mailOptions = {
                            from: 'jayprakash@sesta.org',
                            to: result[count].email,
                            subject: 'sbuject',
                            html: data
                          };
            
                          var user_id = result[count].donor_id;
                        
                          
                          transporter.sendMail(mailOptions, function (err, info) {
                              if (err) {
                                  console.log(err);
                              } else {
                                
                                var date = new Date();
                                var month = date.getMonth();
                                var year = date.getFullYear();
                                let newDate = `${month}/${year}`;
                                console.log(newDate)
                                
            
                                let sql = 'SELECT * FROM newsletter WHERE user_id='+user_id;      
                                 let query = db.query(sql, (err, dbresult) => {
                                     if(err) {
                                      console.log(err.sqlMessage)
                                     }
                                     

                                     if(dbresult.length>0){
                                     
                                      newDate = String(newDate)
                                      let sql = `UPDATE newsletter SET date='${newDate}' WHERE user_id='${user_id}'`;      
                                      let query = db.query(sql, (err, dbresult) => {
                                          if(err) {
                                            console.log(err.sqlMessage)
                                          }
                                      })
                                     }else{
                                        let post ={user_id,date:newDate}
              
                                        let sql = 'INSERT INTO newsletter SET ?';      
                                        let query = db.query(sql, post, (err, result) => {
                                            if(err) {
                                                res.json(err.sqlMessage)
                                            }
                                        });
                                     }
                                    
                                 });
                                  res.redirect(`/bulk`)
                              }
                          });
                      }
                
                    })
                  }  
            });
})



app.post('/bulk-etohop', (req,res)=>{

  var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'jayprakash@sesta.org',
      pass: 'jayraj9196'
    }
  });


    let sql = 'SELECT * FROM donors';      
    let query = db.query(sql, (err, result) => {
      if(err) {
                console.log(err.sqlMessage)
              }
              for(let count = 0; count < result.length; count++) {

              ejs.renderFile(__dirname + "/views/etohop.ejs", { name: 'Stranger' }, function (err, data) {
                  if (err) {
                        console.log(err);
                  } else {
                  
                        var mailOptions = {
                          from: 'jayprakash@sesta.org',
                          to: result[count].email,
                          subject: 'sbuject',
                          html: data
                        };
          
                        var user_id = result[count].donor_id;
                      
                        
                        transporter.sendMail(mailOptions, function (err, info) {
                            if (err) {
                                console.log(err);
                            } else {
                              
                              var date = new Date();
                              var month = date.getMonth();
                              var year = date.getFullYear();
                              let newDate = `${month}/${year}`;
                              console.log(newDate)
                              
          
                              let sql = 'SELECT * FROM etohop WHERE user_id='+user_id;      
                               let query = db.query(sql, (err, dbresult) => {
                                   if(err) {
                                    console.log(err.sqlMessage)
                                   }
                                   

                                   if(dbresult.length>0){
                                   
                                    newDate = String(newDate)
                                    let sql = `UPDATE etohop SET etohop_date='${newDate}' WHERE user_id='${user_id}'`;      
                                    let query = db.query(sql, (err, dbresult) => {
                                        if(err) {
                                          console.log(err.sqlMessage)
                                        }
                                    })
                                   }else{
                                      let post ={user_id,etohop_date:newDate}
            
                                      let sql = 'INSERT INTO etohop SET ?';      
                                      let query = db.query(sql, post, (err, result) => {
                                          if(err) {
                                              res.json(err.sqlMessage)
                                          }
                                      });
                                   }
                                  
                               });
                                res.redirect(`/bulk`)
                            }
                        });
                    }
              
                  })
                }  
          });
})


app.post('/bulk-annual', (req,res)=>{

  var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'jayprakash@sesta.org',
      pass: 'jayraj9196'
    }
  });


    let sql = 'SELECT * FROM donors';      
    let query = db.query(sql, (err, result) => {
      if(err) {
                console.log(err.sqlMessage)
              }
              for(let count = 0; count < result.length; count++) {

              ejs.renderFile(__dirname + "/views/etohop.ejs", { name: 'Stranger' }, function (err, data) {
                  if (err) {
                        console.log(err);
                  } else {
                  
                        var mailOptions = {
                          from: 'jayprakash@sesta.org',
                          to: result[count].email,
                          subject: 'sbuject',
                          html: data
                        };
          
                        var user_id = result[count].donor_id;
                      
                        
                        transporter.sendMail(mailOptions, function (err, info) {
                            if (err) {
                                console.log(err);
                            } else {
                              
                              var date = new Date();
                              var month = date.getMonth();
                              var year = date.getFullYear();
                              let newDate = `${month}/${year}`;
                              console.log(newDate)
                              
          
                              let sql = 'SELECT * FROM annual_report WHERE user_id='+user_id;      
                               let query = db.query(sql, (err, dbresult) => {
                                   if(err) {
                                    console.log(err.sqlMessage)
                                   }
                                   

                                   if(dbresult.length>0){
                                   
                                    newDate = String(newDate)
                                    let sql = `UPDATE annual_report SET annual_date='${newDate}' WHERE user_id='${user_id}'`;      
                                    let query = db.query(sql, (err, dbresult) => {
                                        if(err) {
                                          console.log(err.sqlMessage)
                                        }
                                    })
                                   }else{
                                      let post ={user_id,annual_date:newDate}
            
                                      let sql = 'INSERT INTO annual_report SET ?';      
                                      let query = db.query(sql, post, (err, result) => {
                                          if(err) {
                                              res.json(err.sqlMessage)
                                          }
                                      });
                                   }
                                  
                               });
                                res.redirect(`/bulk`)
                            }
                        });
                    }
              
                  })
                }  
          });
})









const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));