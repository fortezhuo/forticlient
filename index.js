require("dotenv").config()

const subProcess = require('child_process')
const puppeteer = require('puppeteer');
const fs = require("fs")

const initialUrl = `https://${process.env.VPN_HOST}/remote/saml/start`
const emailAddress = process.env.VPN_USERNAME
const password = process.env.VPN_PASSWORD
const param = process.env.VPN_PARAM||""
const otp = fs.readFileSync("./otp.txt","utf8")
console.log("otp",otp)
fs.rmSync("./otp.txt")

const waitForSelectorTimeout = 2000;

;(async function login(url) {
  console.log("Starting VPN ...")
  const browser = await puppeteer.launch({ headless: true,
    args: [ '--ignore-certificate-errors',"--ignore-certificate-errors-spki-list" ]
  });
  const page = await browser.newPage();
  try {
    let currentUrl = url;
    while (true) {
      await page.goto(currentUrl, { waitUntil: 'networkidle0' });
      const newUrl = page.url();
      if (newUrl === currentUrl) {
        break;
      } else {
        currentUrl = newUrl;
      }
    }
    const emailInputSelector = 'input[name="loginfmt"]';
    await page.waitForSelector(emailInputSelector, { timeout: waitForSelectorTimeout });
    await page.type(emailInputSelector, emailAddress, { delay: 10 });
    console.log(`Email filled : ${emailAddress}`)
    const nextButtonSelector = 'input[value="Next"]';
    await page.waitForSelector(nextButtonSelector, { timeout: 10000 });
    await page.click(nextButtonSelector);
    const passwordInputSelector = 'input[name="passwd"]';
    await page.waitForSelector(passwordInputSelector, { timeout: 10000 });
    await page.type(passwordInputSelector, password, { delay: 10 });
    console.log("Password filled : *************")
    const signInButtonSelector = 'input[value="Sign in"]';
    await page.waitForSelector(signInButtonSelector, { timeout: 10000 });
    await page.click(signInButtonSelector);

    if (otp) {
        const otpInputSelector = 'input[name="otc"]';
        await page.waitForSelector(otpInputSelector, { timeout: 10000 });
        await page.type(otpInputSelector, otp, { delay: 10 });
        const verifyButtonSelector = 'input[value="Verify"]';
        await page.waitForSelector(verifyButtonSelector, { timeout: 10000 });
        await page.click(verifyButtonSelector,{delay:1000});
        console.log(`OTP filled ${otp}`)
    }
    const cookies = await page.cookies();
    const svpnCookie = cookies.find(cookie => cookie.name === 'SVPNCOOKIE');
    const value = svpnCookie.value
    const script = `openfortivpn ${process.env.VPN_HOST} ${param} --cookie "SVPNCOOKIE=${value}"`

    subProcess.exec(script, (err, stdout, stderr) => {
        if (err) {
          console.error(err)
          process.exit(1)
        } else {
          console.log(`The stdout Buffer from shell: ${stdout.toString()}`)
          console.log(`The stderr Buffer from shell: ${stderr.toString()}`)
        }
      })
    
  } catch (error) {
    console.info("Error:", error);
  } finally {
    await browser.close();
    console.debug("FortiClient VPN connected...");
  }
})(initialUrl)