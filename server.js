const express = require("express");
const app = express();
const cors = require("cors");

//View engine (ejs)
app.set("view engine", "ejs");
app.set("views", "views");

//Middleware
app.use(cors({
    origin: "*"
}))
app.use(express.static('./public'))
app.use(express.json());
app.use(express.urlencoded({extended: false}))


app.post("/payment", (req, res) => {
    const products = req.body.products;
    //https://developers.momo.vn/#/docs/en/aiov2/?id=payment-method
    //parameters
    let totalPrice = 0;
    console.log("products: " + products);
    if (products) {
        products.forEach((product) => {
            console.log(product);
            totalPrice += parseInt(product.price);
        })
    }
    console.log(totalPrice);
    var partnerCode = "MOMO";
    var accessKey = "F8BBA842ECF85";
    var secretkey = "K951B6PE1waDMi640xX08PD3vg6EkVlz";
    var requestId = partnerCode + new Date().getTime();
    var orderId = requestId;
    var orderInfo = "Thanh toán với ATM MoMo";
    //var redirectUrl = "https://momo-test.onrender.com/";
    //var ipnUrl = "https://momo-test.onrender.com/api/notify"; 
    const redirectUrl = "http://localhost:5000/";
    var ipnUrl = "http://localhost:5000/api/notify"; 
    // var ipnUrl = redirectUrl = "https://webhook.site/454e7b77-f177-4ece-8236-ddf1c26ba7f8";
    var amount = "" + totalPrice;
    var requestType = "payWithATM"
    var extraData = ""; //pass empty value if your merchant does not have stores

    //before sign HMAC SHA256 with format
    //accessKey=$accessKey&amount=$amount&extraData=$extraData&ipnUrl=$ipnUrl&orderId=$orderId&orderInfo=$orderInfo&partnerCode=$partnerCode&redirectUrl=$redirectUrl&requestId=$requestId&requestType=$requestType
    var rawSignature = "accessKey="+accessKey+"&amount=" + amount+"&extraData=" + extraData+"&ipnUrl=" + ipnUrl+"&orderId=" + orderId+"&orderInfo=" + orderInfo+"&partnerCode=" + partnerCode +"&redirectUrl=" + redirectUrl+"&requestId=" + requestId+"&requestType=" + requestType
    //puts raw signature
    console.log("--------------------RAW SIGNATURE----------------")
    console.log(rawSignature)
    //signature
    const crypto = require('crypto');
    var signature = crypto.createHmac('sha256', secretkey)
        .update(rawSignature)
        .digest('hex');
    console.log("--------------------SIGNATURE----------------")
    console.log(signature)

    //json object send to MoMo endpoint
    const requestBody = JSON.stringify({
        partnerCode : partnerCode,
        accessKey : accessKey,
        requestId : requestId,
        amount : amount,
        orderId : orderId,
        orderInfo : orderInfo,
        redirectUrl : redirectUrl,
        ipnUrl : ipnUrl,
        extraData : extraData,
        requestType : requestType,
        signature : signature,
        lang: 'en'
    });
    
    fetch("https://test-payment.momo.vn/v2/gateway/api/create", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
        },
        body: requestBody
    })
    .then(res => res.json())
    .then((data) => {
        // console.log("data: ", data);
        if (data.payUrl != null) {
            return res.json({
                status: "success",
                nextUrl: data.payUrl
            })
        }
        return res.json({
            status: "fail"
        })
        
    })
    .catch(err => console.log(err));


});


app.get("/", (req, res) => {
    const resultCode = req.query.resultCode;
    console.log("resultCode: ", resultCode); 
    if (resultCode != null) {
        return res.render("./paySuccessfully.ejs", req.query);
    } 
    return res.render("home.ejs");
})

app.post("/api/notify", (req, res) => {
    console.log("Payment infor: ", req.body);
    return res.status(204);
})



app.listen(5000, () => console.log("Server is running on PORT 5000"));
