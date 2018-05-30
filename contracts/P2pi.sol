pragma solidity ^0.4.20;

contract Owned {
    address public owner;

    constructor()  public {
        owner = msg.sender;
    }

    modifier onlyOwner {
        require(msg.sender == owner);
        _;
    }

    function transferOwnership(address newOwner) onlyOwner  public {
        owner = newOwner;
    }
}

contract P2pi is Owned{

    event memberAdded(address targetMember, string membername,bool isApproved);
    event memberApproved(address targetMember, string membername,bool isApproved);

    struct Member{
        address memberAdd;
        string name;
        uint memberSince;
        bool isApproved;
    }

    mapping(address => uint) public memberId;
    Member[] public members;
    uint public memberCount;

    modifier onlyMembers{
        require(memberId[msg.sender] !=0);
        require(members[memberId[msg.sender]].isApproved == true);
        _;
    }
    constructor() public{
        addMember(0,"");
        addMember(owner,'founder');
    }
    function addMember(address targetMember, string memberName) onlyOwner public{
        uint id = memberId[targetMember];
        if(id==0){
          id = members.length++;
          memberId[targetMember] = id;
        }
        members[id] = Member({memberAdd:targetMember,memberSince:now, name: memberName,isApproved:true});
        memberCount++;
        emit memberAdded(targetMember,memberName,true);
    }

    function join(string memberName) public {
        require(memberId[msg.sender] == 0);
        uint id = memberId[msg.sender];
        if(id==0){
          id = members.length++;
          memberId[msg.sender] = id;
        }
        members[memberCount] = Member({memberAdd:msg.sender,memberSince:now, name: memberName,isApproved:false});
        memberCount++;
        emit memberAdded(msg.sender,memberName,false);
    }
    function approveMember(address targetMember) onlyOwner public {
        require(memberId[targetMember] != 0);
        uint id = memberId[targetMember];
        members[id].isApproved = true;
        emit memberApproved(targetMember,members[id].name,true);
    }

    event proposalAdded(uint proposapId,string desc);
    event proposalJoined(uint proposalid, address targetMember);
    event emiPayment(uint proposalId, address targetMember, uint256 amount);

    struct Payments{
        address memberAdd;
        uint paymentTS;
        uint amount;
    }
    mapping(address =>uint256) paymentCount;

    struct Claim{
        address claimer;
        uint claimAmount;
        string claimReason;
        bool isApproved;
        uint voteInSupport;
        uint voteNotInSupport;
        mapping(address => bool) voted;
    }

    struct Proposal{
        address creator;
        uint amount;
        uint minAmount;
        string desc;
        bytes32 proposalHash;
        bool isApproved;
        uint memberCount;
        mapping(address =>bool) isPart;
        mapping(address => mapping(uint256 => Payments)) memberPayments;
        mapping(address =>mapping(uint => Claim)) claims;
    }


    Proposal[] public proposals;
    uint public numProposals;
    Claim[] public claim;
    mapping(address => uint) claimCount;

    function newProposal(
        uint weiAmount,
        string description,
        bytes32 ppHash
        ) onlyMembers public returns(uint proposalId){
            proposalId = proposals.length++;
            Proposal storage p = proposals[proposalId];
            p.creator = msg.sender;
            p.minAmount = weiAmount;
            p.desc = description;
            p.proposalHash = ppHash;
            p.isApproved = false;
            p.isPart[msg.sender] = true;
            p.memberCount++;
            numProposals++;

            emit proposalAdded(proposalId,description);

            return proposalId;
    }


   function joinPorposal(uint proposalId) onlyMembers public{
       Proposal storage p = proposals[proposalId];
       require(!p.isPart[msg.sender]);
       p.isPart[msg.sender] = true;
       p.memberCount++;
       emit proposalJoined(proposalId,msg.sender);
   }

   function checkIfPartOfProposal(uint proposalId) onlyMembers view public returns(bool isPart){
     Proposal storage p = proposals[proposalId];
     return p.isPart[msg.sender];
   }

  }
