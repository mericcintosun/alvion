# Algorand-dApp-Quick-Start-Template-TypeScript

This is a full-stack starter template for quickly building and testing Web3 ideas on Algorand. It includes:

- Wallet connection
- Send ALGO payments
- NFT minting (IPFS metadata via Pinata)
- Token (ASA) creation
- Smart contract interaction demo

Use this template to kickstart your project, prototype ideas, and showcase a working proof-of-concept.

## 🌟 How To Get Started Instructions

### **Fork the Repo:**

To create your own copy of this repository:

a. **Go to the GitHub Repository:**
   - Navigate to the main page which is the current one your on.

b. **Click the "Fork" Button:**
   - In the top-right corner of the page, click the **Fork** button. This will create a copy of the repository under your GitHub account. Feel free to hit the ⭐️ aswell so you can find the Algorand-dApp-Quick-Start-Template-Typescript repo easily!

c. **Wait for the Forking Process to Complete:**
   - GitHub will take a few moments to create the fork. Once complete, you’ll be redirected to your newly created fork.


https://github.com/user-attachments/assets/92e746e1-3143-4769-8a5a-1339e4bd7a14


## 🚀 Start with Codespaces
This is the fastest way to get up and running!

1. **Create a Codespace:**

   - Click the green "Code" button at the top right of your forked repo.
   - Select "Create codespace on main".
   - Once your Codespace is fully loaded, you are ready to go!

Make sure to wait for algokit to be installed automatically - it should only take a few mins max!

2. **While in Codespace:**
   - Enter the workspace 
   <img width="2794" height="1524" alt="image" src="https://github.com/user-attachments/assets/41f25490-1284-4998-b342-27f7a0ffb420" />

3. **Give it a testrun!:** (WIP)
   - Click on run & debug
   - Run and deploy the hello world smart contract
   - And then run dApp - check out what is already given to you. Or simply `npm run dev` in the CLI!
   <img width="1528" height="808" alt="image" src="https://github.com/user-attachments/assets/2f337d67-02e2-4b0c-8244-109951269b5e" />

**Pro Tip:** GitHub Codespaces is included with free accounts but comes with a monthly limit of 60 hours.  

To avoid losing your progress, be sure to **commit your changes regularly** — just like shown in the video demo below — so your updates are saved to your forked repository.

https://github.com/user-attachments/assets/dd452ea1-3070-4718-af34-bea978e208ab


## For Local Devs:
If `npm run dev` doesn’t work, run:   `npm install --save-dev @algorandfoundation/algokit-client-generator`

And create your `.env` file by copying from the `.env.template`


## Project Structure Simplified

- `projects/QuickStartTemplate-frontend/src/` — Frontend code (The webpage)  
- `projects/QuickStartTemplate-frontend/src/App.tsx` — Main app layout and routing  
- `projects/QuickStartTemplate-frontend/src/components/Transact.tsx` — Simple transfer ALGO logic (Provided to you thanks to AlgoKit)  
- `projects/QuickStartTemplate-frontend/src/components/NFTmint.tsx` — Simple NFT minting interface  
- `projects/QuickStartTemplate-frontend/src/components/Tokenmint.tsx` — Simple token (ASA) minting interface  
- `projects/QuickStartTemplate-frontend/src/components/AppCalls.tsx` — Smart contract interaction demo  
- `projects/QuickStartTemplate-contracts/smart_contracts/hello_world/contract.algo.ts` — Example TypeScript smart contract  


## Reference Guide

Need more help? See the Algorand-dApp-Quick-Start-Template Reference Guide for step-by-step instructions, AI prompts, and troubleshooting tips:

[View the guide](https://docs.google.com/document/d/1f_ysbtFOLKM_Tjvey7VCcGYsAzOmyEVmsdC5si936wc/edit?usp=sharing)


