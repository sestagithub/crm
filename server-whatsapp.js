const express = require('express');
const app = express();

const mailer = require("@sendgrid/mail"); 

const wbm = require('wbm');

const accountSid ='AC65580484470b3cddfd94b6d3089ec525';
const authToken ='7e3c10f460e4fcab5f6bbf8cf2f0008f';
const client = require('twilio')(accountSid, authToken);




app.post('/send',(req,res)=>{

    client.messages
    .create({
       body: 'Hello, there trail 2!',
       from: 'whatsapp:+14155238886',       
        to: 'whatsapp:+918472074629',
       mediaUrl:'https://2.bp.blogspot.com/-bzzH8DP_uiM/Xz87Wfe0xmI/AAAAAAAAC48/d_3klP2WJvEsNUf1ZGkDmG-v8KVrVnliwCLcBGAsYHQ/s1600/21.08.202014.jpg'

     })
    .then(message => console.log(message.sid))
    .catch(err=>console.log(err))

})


// app.post('/send',(req,res)=>{

//     mailer.setApiKey("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"); 



    // var listofemails = ["jayprakash@sesta.org","info@sesta.org","admin@sesta.org"];
    
//     const msg = { 
//         to: listofemails, 
//         from: "dasjay084@gmail.com", 
//         subject: "Message sent for demo purpose", 
//         html: 
//           "<h1>New message from Geeksforgeeks</h1> "
       
//       }

//       mailer.send(msg, function(err, json) { 
//         if (err) { 
//           console.log(err); 

//             res.write("Can't send message sent"); 

//         } else { 
//           res.write("Message sent"); 
//         } 
//       }); 

    


// })







const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));