var P2pi = artifacts.require("./P2pi.sol");
contract("P2pi", function(accounts){
  var p2piInstance;

  it("initializes two members", function(){
    return P2pi.deployed().then(function(instance){
      return instance.memberCount();
    }).then(function(count){
      assert.equal(count,2);
    });
  });

  it("allows a person to become a member", function() {
    return P2pi.deployed().then(function(instance) {
      p2piInstance = instance;
      return p2piInstance.join("member2", { from: accounts[4] });
    }).then(function(receipt) {
     return p2piInstance.memberCount();
   }).then(function(member) {
     var cnt = member.toNumber() - 1;
     return p2piInstance.members(cnt);
   }).then(function(mem){
     assert.equal(mem[1],"member2");
   });
  });

  it("approving a member member", function() {
    return P2pi.deployed().then(function(instance) {
      p2piInstance = instance;
      return p2piInstance.approveMember(accounts[4]);
    }).then(function(receipt) {
     return p2piInstance.memberCount();
   }).then(function(member) {
     var cnt = member.toNumber() - 1;
     return p2piInstance.members(cnt);
   }).then(function(mem){
     assert.equal(mem[3],true);
   });
  });

  it("Creating a proposal", function() {
    return P2pi.deployed().then(function(instance) {
      p2piInstance = instance;
      return p2piInstance.newProposal(5,"testproposal","testproposal");
    }).then(function(receipt) {
     return p2piInstance.numProposals();
   }).then(function(proposalCount) {
     //assert.equal(proposalCount.toNumber(),1);
     var id = proposalCount.toNumber() - 1;
     return p2piInstance.proposals(id);
   }).then(function(proposal){
     assert.equal(proposal[3],"testproposal");
   });
  });

  it("Joining a proposal", function() {
    return P2pi.deployed().then(function(instance) {
      p2piInstance = instance;
      return p2piInstance.joinPorposal(0);
    }).then(function(receipt) {
      return p2piInstance.proposals(0);
   }).then(function(proposal){
     return proposal[7];
   }).then(function(mem){
     assert.equal(mem[accounts[0]],true);
   });
  });
});
