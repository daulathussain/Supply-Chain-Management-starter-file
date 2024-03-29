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
    const getAllShipments=async()=>{
        try{
            const provider=new ethers.providers.JsonRpcProvider();
            const contract=fetchContract(provider);
            const shipments=await contract.getAllShipments();
            const allShipments = shipments.map((shipment) => ({
              sender: shipment.sender,
              receiver: shipment.receiver,
              price: ethers.utils.formatEther(shipment.price.toString()),
              pickupTime: shipment.pickupTime.toNumber(),
              deliveryTime: shipment.deliveryTime.toNumber(),
              distance: shipment.distance.toNumber(),
              isPaid: shipment.isPaid,
            }));
            return allShipments;
        }
        catch(error){
            console.log("error want,getting shipment");
        }
    };
    const getShipmentCount=async()=>{
        try{
            if(!window.ethereum) return "Install Metamask";
            const accounts=await window.ethereum.request({method:"eth_accounts"});
            const provider=new ethers.providers.JsonRpcProvider();
            const contract=fetchContract(provider);
            const shipmentCount=await contract.getShipmentCount(accounts[0]);
            return shipmentCount.toNumber();
        }
        catch(error){
            console.log("error want,getting shipment");
        }
    };
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
            transaction.wait();
            console.log(transaction);

            }
        catch(error){
            console.log("wrong Complete Shipment",error);
        }
    };

    const getShipment =async(index)=>{
        console.log(index*1);
        try{
            if(!window.ethereum) return "Install Metamask";
            const accounts=await window.ethereum.request({method:"eth_accounts"});
            const provider=new ethers.providers.JsonRpcProvider();
            const contract=fetchContract(provider);
            const shipment=await contract.getShipment(accounts[0],index*1);
            const SingleShiplent={
                sender: shipment[0],
                receiver: shipment[1],
                pickupTime: shipment[2].toNumber(),
                deliveryTime: shipment[3].toNumber(),
                distance: shipment[4].toNumber(),
                price: ethers.utils.formatEther(shipment[5].toString()),
                status:shipment[6],
                isPaid: shipment[7],
                };
                return SingleShiplent;
            }catch(error)
            {
                console.log("Sorry no chipment");
            }
        };
        const startShipment=async(getProduct)=>{
            const{receiver,index}=getProduct;
            try{
                if(!window.ethereum) return "Install Metamask";
                const accounts=await window.ethereum.request({method:"eth_accounts"});
                const web3Modal=new Web3Modal();
                const connection=await web3Modal.connect();
                const provider=new ethers.providers.Web3Provider(connection);
                const signer=provider.getSigner();
                const contract=fetchContract(signer);
                const shipment=await contract.startShipment(accounts[0],receiver,index*1);
                shipment.wait();
                console.log(shipment);      
        }catch(error)
        {
            console.log("Something went wrong",error);
        }
        };
        //---Check wallet connection
        const checkIfWalletConnected=async()=>{
            try{
                if(!window.ethereum) return "Install Metamask";
                const accounts=await window.ethereum.request({method:"eth_accounts"});
                if(accounts.length)
                {
                    setCurrentUser(accounts[0]);
                }
                else
                {
                    return "No accounts found";
                }

            }catch(error)
            {
                return "not connected";
            }
        };

        const connectWallet=async()=>{
            try{
                if(!window.ethereum) return "Install Metamask";
                const accounts=await window.ethereum.request({method:"eth_requestAccounts"});
                setCurrentUser(accounts[0]);
            }catch(error)
            {
                return "Something went wrong";
            }
        };
        useEffect(()=>{
            checkIfWalletConnected();
        },[]);

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
        
