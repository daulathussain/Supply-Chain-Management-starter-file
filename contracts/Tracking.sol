// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Tracking {
    enum ShipmentStatus{ PENDING,IN_TRANSIST,DELIVERED}
    struct Shipment {
        address sender;
        address reciever;
        uint256 pickupTime;
        uint256 deliveryTime;
        uint256 distance;
        uint256 price;
        ShipmentStatus status;
        bool isPaid;
    }
    mapping (address => Shipment[]) public shipments ;
    uint256 public shipmentCount;
    struct TypeShipment {
        address sender;
        address reciever;
        uint256 pickupTime;
        uint256 deliveryTime;
        uint256 distance;
        uint256 price;
        ShipmentStatus status;
        bool isPaid;
    }
    TypeShipment[] typeShipments;
    
    event ShipmentCreated(address indexed sender,address indexed reciever, uint256 pickupTime , uint256 distance, uint256 price);
    event ShipmentInTransit(address indexed sender,address indexed reciever,uint256 pickupTime);
    event ShipmentDelivered(address indexed sender,address indexed reciever,uint256 deliveryTime);
    event ShipmentPaid( address indexed sender,address indexed reciever,uint256 amount);

    constructor ()
    {
        shipmentCount=0;
    }

    function createShipment(address _reciever,uint256 _pickupTime,uint256 _distance,uint256 _price) public payable{
        require(msg.value==_price,"Payment amount must match the price.");

        Shipment memory shipment =Shipment(msg.sender,_reciever,_pickupTime,0,_distance,_price,ShipmentStatus.PENDING,false);
        shipments[msg.sender].push(shipment);
        shipmentCount++;
        typeShipments.push(
            TypeShipment(
                msg.sender,
                _reciever,
                _pickupTime,
                0,
                _distance,
                _price,
                ShipmentStatus.PENDING,
                false
            )
        );
        emit ShipmentCreated(msg.sender,_reciever,_pickupTime,_distance,_price);    
    }

    function startShipment(address _sender,address _reciever,uint256 _index) public{
        Shipment storage shipment = shipments[_sender][_index];
        TypeShipment storage typeShipment = typeShipments[_index];
        require(shipment.reciever==_reciever,"Invalid reciever");
        require(shipment.status==ShipmentStatus.PENDING,"Shipment already in transit");

        shipment.status=ShipmentStatus.IN_TRANSIST;
        typeShipment.status=ShipmentStatus.IN_TRANSIST;
        emit ShipmentInTransit(_sender,_reciever,shipment.pickupTime);
    }

    function completeShipment(address _sender,address _reciever,uint256 _index) public{
        Shipment storage shipment = shipments[_sender][_index];

        TypeShipment storage typeShipment = typeShipments[_index];
        require(shipment.reciever==_reciever,"Invalid reciever");
        require(shipment.status==ShipmentStatus.IN_TRANSIST,"Shipment not in transit");
        require(!shipment.isPaid,"Shipment already paid");

        shipment.status=ShipmentStatus.DELIVERED;
        typeShipment.status=ShipmentStatus.DELIVERED;
        typeShipment.deliveryTime=block.timestamp;
        uint256 amount=shipment.price;
        payable(shipment.sender).transfer(amount);

        shipment.isPaid=true;
        typeShipment.isPaid=true;
        emit ShipmentDelivered(_sender,_reciever,shipment.deliveryTime);
        emit ShipmentPaid(_sender,_reciever,amount);
    }
    
}
