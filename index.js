require("dotenv").config({ path: `/Users/forte/Workspace/FZ/vpn/.env` });

const subProcess = require('child_process')
const puppeteer = require('puppeteer-core');
const fs = require("fs")

const initialUrl = `https://${process.env.VPN_HOST}/remote/saml/start`
const emailAddress = process.env.VPN_USERNAME
const password = process.env.VPN_PASSWORD
const param = process.env.VPN_PARAM||""
const otp = fs.readFileSync(`${process.env.ROOT_FOLDER}/otp.txt`,"utf8")
fs.rmSync(`${process.env.ROOT_FOLDER}/otp.txt`)

const waitForSelectorTimeout = 2000;

;(async function login(url) {
  console.log("FortiClient VPN initiated ...\n")
    const browser = await puppeteer.launch({
    headless: false,
    args: [ '--ignore-certificate-errors',"--ignore-certificate-errors-spki-list",
      '--incognito',
     ],
    executablePath:
      "/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome",
  })

  const context = browser.defaultBrowserContext()
  const pages = await context.pages()
  const page =  pages[0]
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
    console.log(`Email    : ${emailAddress}`)
    const nextButtonSelector = 'input[value="Next"]';
    await page.waitForSelector(nextButtonSelector, { timeout: 30000 });
    await page.click(nextButtonSelector);
    const passwordInputSelector = 'input[name="passwd"]';
    await page.waitForSelector(passwordInputSelector, { timeout: 30000 });
    await page.type(passwordInputSelector, password, { delay: 10 });
    console.log("Password : *************")
    const signInButtonSelector = 'input[value="Sign in"]';
    await page.waitForSelector(signInButtonSelector, { timeout: 30000 });
    await page.click(signInButtonSelector);

    if (otp) {
        const otpInputSelector = 'input[name="otc"]';
        await page.waitForSelector(otpInputSelector, { timeout: 30000 });
        await page.type(otpInputSelector, otp, { delay: 10 });
        console.log(`OTP      : ${otp}`)
        const verifyButtonSelector = 'input[value="Verify"]';
        await page.waitForSelector(verifyButtonSelector, { timeout: 10000 });
        console.log(`FortiClient VPN wait to connect ...`)
        await page.click(verifyButtonSelector,{delay:10000});
    }
    const cookies = await page.cookies();
    let svpnCookie = cookies.find(cookie => cookie.name === 'SVPNCOOKIE');

    if(!svpnCookie) {
      console.log("Try Fetch Cookie 1st time ...")
      svpnCookie = await fetchCookie(page, initialUrl)
    }
    if(!svpnCookie) {
      console.log("Try Fetch Cookie 2nd time ...")
      svpnCookie = await fetchCookie(page, initialUrl)
    }
    if(!svpnCookie) {
      console.log("Try Fetch Cookie 3rd time ...")
      svpnCookie = await fetchCookie(page, initialUrl)
    }
    if(!svpnCookie) {
      console.log("Try Fetch Cookie 4th time ...")
      svpnCookie = await fetchCookie(page, initialUrl)
    }
    if(!svpnCookie) {
      console.log("Try Fetch Cookie 5th time ...")
      svpnCookie = await fetchCookie(page, initialUrl)
    }

    if(!svpnCookie){
      throw new Error("Cookie not found, please try again")
    }

    const value = svpnCookie.value
    const script = `openfortivpn ${process.env.VPN_HOST} ${param} --cookie "SVPNCOOKIE=${value}"`

    subProcess.exec(script, (err) => {
        if (err) {
          console.error(err)
          process.exit(1)
        } 
      })
    console.log("FortiClient VPN connected ...");
      
  } catch (error) {
    console.info("Error:", error);
  } finally {
//    await browser.close();
  }
})(initialUrl)


async function fetchCookie(page, initialUrl){
  await page.goto(initialUrl, { waitUntil: 'networkidle0' });
  const cookies = await page.cookies();
  svpnCookie = cookies.find(cookie => cookie.name === 'SVPNCOOKIE');
  return svpnCookie
}