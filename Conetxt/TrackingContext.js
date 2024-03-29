import React,{useState,useEffect} from "react";
import Web3Modal from "web3modal";
import { ethers } from "ethers";


import tracking from "../Conetxt/Tracking.json";
const ContractAddress="0x5FbDB2315678afecb367f032d93F642f64180aa3"
const ContractABI=tracking.abi;

const fetchContract=(signerOrProvider)=>new ethers.Contract(ContractAddress,ContractABI,signerOrProvider);

export const TrackingContext=React.createContext();

export const TrackingProvider=({children})=>{
    const DappName="Product tracking app";
    const [currentUser,setCurrentUser]=useState("");
    /**
     * Creates a new shipment
     * 
     * @param {Object} items Shipment details
     * @param {string} items.receiver Address of the receiver
     * @param {Date} items.pickupTime Pickup time
     * @param {number} items.distance Distance between sender and receiver
     * @param {string} items.price Price of the shipment
     */
    const createShipment=async(items)=>{
        console.log(items);
        const {receiver,pickupTime,distance,price}=items;
        try{
            const web3Modal=new Web3Modal();
            const connection=await web3Modal.connect();
            const provider=new ethers.providers.Web3Provider(connection);
            const signer=provider.getSigner();
            const contract=fetchContract(signer);
            const createItem=await contract.createShipment(receiver,new Date(pickupTime).getTime(),distance,ethers.utils.parseUnits(price,18),
            {
              value:ethers.utils.parseUnits(price,18),  
            });
            await createItem.wait();
            console.log(createItem);

        }
        catch(error){
            console.log("Something went wrong",error);
        }
    };    
    /**
     * Gets all shipments
     * 
     * @returns {Object[]} Array of shipment objects
     */
    const getAllShipments=async()=>{
        try{
            const provider=new ethers.providers.JsonRpcProvider();
            const contract=fetchContract(provider);
            const shipments=await contract.getAllShipments();
            const allShipments = shipments.map((shipment) => ({
              /**
               * Sender address
               */
              sender: shipment.sender,
              /**
               * Receiver address
               */
              receiver: shipment.receiver,
              /**
               * Price of the shipment in ETH
               */
              price: ethers.utils.formatEther(shipment.price.toString()),
              /**
               * Pickup time in seconds
               */
              pickupTime: shipment.pickupTime.toNumber(),
              /**
               * Delivery time in seconds
               */
              deliveryTime: shipment.deliveryTime.toNumber(),
              /**
               * Distance between sender and receiver in meters
               */
              distance: shipment.distance.toNumber(),
              /**
               * Whether the shipment is paid or not
               */
              isPaid: shipment.isPaid,
            }));
            return allShipments;
        }
        catch(error){
            console.log("Error while getting all shipments",error);
        }
    };
    /**
     * Get total number of shipments created by a user
     * 
     * @returns {Promise<number>} Number of shipments created
     */
    const getShipmentCount = async () => {
        try {
            // Check if Metamask is installed
            if (!window.ethereum) return "Install Metamask";
            // Get accounts
            const accounts = await window.ethereum.request({ method: "eth_accounts" });
            // Create a JsonRpcProvider
            const provider = new ethers.providers.JsonRpcProvider();
            // Fetch the contract
            const contract = fetchContract(provider);
            // Get shipment count
            const shipmentCount = await contract.getShipmentCount(accounts[0]);
            // Return the number of shipments
            return shipmentCount.toNumber();
        } catch (error) {
            // Log an error if there is one
            console.log("Error while getting shipment count", error);
        }
    };
    /**
     * Completes a shipment
     * 
     * @param {Object} completeShip Details of the shipment to be completed
     * @param {string} completeShip.receiver Address of the receiver
     * @param {number} completeShip.index Index of the shipment
     * 
     * @returns {Promise<Object>} Transaction details
     */
    const completeShipment=async(completeShip)=>{
        console.log(completeShip);
        const {receiver,index}=completeShip;
        try{
            if(!window.ethereum) return "Install Metamask";
            const accounts=await window.ethereum.request({method:"eth_accounts"});
            const web3Modal=new Web3Modal();
            const connection=await web3Modal.connect();
            const provider=new ethers.providers.Web3Provider(connection);
            const signer=provider.getSigner();
            const contract=fetchContract(signer);
            const transaction = await contract.completeShipment(accounts[0],
                receiver,index,
                {
                    getLimit:30000,
                }
            );
            await transaction.wait(); // Wait until the transaction is mined
            console.log(transaction);

            return transaction; // Return the transaction details
            }
        catch(error){
            console.log("Error while completing shipment",error);
        }
    };


    /**
     * Get shipment details of a user
     * 
     * @param {number} index Index of the shipment
     * 
     * @returns {Promise<Object>} Shipment details
     */
    const getShipment = async (index) => {
        // Convert index to a number
        const shipmentIndex = index * 1;
        console.log(shipmentIndex);
        try {
            if (!window.ethereum) return "Install Metamask";
            // Get accounts
            const accounts = await window.ethereum.request({ method: "eth_accounts" });
            // Create a JsonRpcProvider
            const provider = new ethers.providers.JsonRpcProvider();
            // Fetch the contract
            const contract = fetchContract(provider);
            // Get shipment details
            const shipment = await contract.getShipment(accounts[0], shipmentIndex);
            // Create an object with shipment details
            const SingleShipment = {
                sender: shipment[0],
                receiver: shipment[1],
                pickupTime: shipment[2].toNumber(),
                deliveryTime: shipment[3].toNumber(),
                distance: shipment[4].toNumber(),
                price: ethers.utils.formatEther(shipment[5].toString()),
                status: shipment[6],
                isPaid: shipment[7],
            };
            // Return the shipment details
            return SingleShipment;
        } catch (error) {
            // Log an error if there is one
            console.log("Sorry no shipment");
        }
    };
        /**
         * Starts a shipment
         * 
         * @param {Object} getProduct Product details
         * @param {string} getProduct.receiver Address of the receiver
         * @param {number} getProduct.index Index of the product
         * 
         * @returns {Promise<void>} Transaction details
         */
        const startShipment = async (getProduct) => {
            const { receiver, index } = getProduct;
            try {
                if (!window.ethereum) return "Install Metamask";
                const accounts = await window.ethereum.request({ method: "eth_accounts" });
                const web3Modal = new Web3Modal(); // Creates a new instance of Web3Modal
                const connection = await web3Modal.connect(); // Connects to the user's wallet
                const provider = new ethers.providers.Web3Provider(connection); // Creates a new provider
                const signer = provider.getSigner(); // Gets a signer from the provider
                const contract = fetchContract(signer); // Fetches the contract
                const shipment = await contract.startShipment(accounts[0], receiver, index * 1); // Calls startShipment
                await shipment.wait(); // Waits until the transaction is mined
                console.log(shipment); // Logs the transaction details
            } catch (error) {
                console.log("Something went wrong", error); // Logs an error if there is one
            }
        };
        /**
         * Checks if a wallet is connected to the site
         *
         * @returns {Promise<string>} Either a string with an account if connected
         * or a string with the error message if not connected
         */
        const checkIfWalletConnected = async () => {
            try {
                if (!window.ethereum) return "Install Metamask"; // Check if Metamask is installed
                const accounts = await window.ethereum.request({ method: "eth_accounts" }); // Fetch the accounts
                if (accounts.length) {
                    setCurrentUser(accounts[0]); // Set the current user to the first account
                } else {
                    return "No accounts found"; // If no accounts are found, return this message
                }
            } catch (error) {
                return "not connected"; // If there is an error, return this message
            }
        };

        const connectWallet=async()=>{
            /**
             * Connects a wallet to the site.
             *
             * @returns {Promise<string>} Either a string with the connected account if successful or a
             * string with the error message if not
             */
            const connectWallet = async () => {
                try {
                    if (!window.ethereum) return "Install Metamask"; // Check if Metamask is installed
                    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" }); // Fetch the accounts
                    setCurrentUser(accounts[0]); // Set the current user to the first account
                } catch (error) {
                    return "Something went wrong"; // If there is an error, return this message
                }
            };
        // useEffect(()=>{ // Runs the checkIfWalletConnected function when the component mounts
            checkIfWalletConnected();
        };

        return(
            <TrackingContext.Provider value={{
                connectWallet,
                createShipment,
                getAllShipments,
                completeShipment,
                getShipment,
                getShipmentCount,
                startShipment,
                DappName,
                currentUser,
            }}
            >{children}</TrackingContext.Provider>
        );

    };
        
