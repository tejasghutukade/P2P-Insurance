App = {
  web3Provider: null,
  contracts: {},
  memberCount:0,

  init: function() {
    return App.initWeb3();
  },

  initWeb3: function() {
    // TODO: refactor conditional
    if (typeof web3 !== 'undefined') {
      // If a web3 instance is already provided by Meta Mask.
      App.web3Provider = web3.currentProvider;
      web3 = new Web3(web3.currentProvider);
    } else {
      // Specify default instance if no web3 instance provided
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
      web3 = new Web3(App.web3Provider);
    }
    return App.initContract();
  },

  initContract: function() {
    $.getJSON("P2pi.json", function(P2pi) {
      // Instantiate a new truffle contract from the artifact
      App.contracts.P2pi = TruffleContract(P2pi);
      // Connect provider to interact with contract
      App.contracts.P2pi.setProvider(App.web3Provider);

      App.listenForEvents();
      return App.render();
    });
  },

  // Listen for events emitted from the contract
  listenForEvents: function() {
    App.contracts.P2pi.deployed().then(function(instance) {
      // Restart Chrome if you are unable to receive this event
      // This is a known issue with Metamask
      // https://github.com/MetaMask/metamask-extension/issues/2393
      instance.memberAdded({}, {
      //  fromBlock: 0, // causes the event to trigger for all the blocks
        toBlock: 'latest'
      }).watch(function(error, event) {
        console.log("event triggered", event)
        // Reload when a new vote is recorded
        App.render();
      });
      instance.proposalAdded({}, {
      //  fromBlock: 0, // causes the event to trigger for all the blocks
        toBlock: 'latest'
      }).watch(function(error, event) {
        console.log("event triggered", event)
        // Reload when a new vote is recorded
        App.render();
      });
    });
  },
  // bindEvents: function() {
  //   // $(document).on('click', '.btn-adopt', App.handleAdopt);
  // },
  render: function() {
    var p2pInstance;
    var loader = $("#loader");
    var content = $("#content");
    App.is_founder();
    loader.show();
    content.hide();
    $("#joinForm").hide();

    //Load account data
    web3.eth.getCoinbase(function(err, account) {
      if (err === null) {
        App.account = account;
        $("#accountAddress").html("Your Account: " + account);
      }
    });

    // // Load contract data
    App.contracts.P2pi.deployed().then(function(instance) {
      p2pInstance = instance;
      return p2pInstance.memberId(App.account);
    }).then(function(id) {
      if(id.toNumber() == 0){
        $("#is_member").html("Not a member Yet. ");
        $("#joinForm").show();
        loader.hide();
        content.show();
        return false;
      }else{
        return p2pInstance.members(id.toNumber());
      }
    }).then(function(member) {
      if(member){
        if(!member[3]){
            $("#is_member").html(member[1].toUpperCase() + " is a member. The account is yet to be approved by the administrator.");
        }else{
          $("#is_member").html(member[1].toUpperCase() + " is a member and the account is approved.");
        }
        loader.hide();
        content.show();
      }
    });
  },
  join: function() {
    App.contracts.P2pi.deployed().then(function(instance) {
      var memName = $("#memberName").val();
      return instance.join(memName);
    }).then(function(result) {
      // Wait for votes to update
      $("#content").hide();
      $("#loader").show();
    }).catch(function(err) {
      console.error(err);
    });
  },

  is_founder:function(){
    var p2pInstance;
    $("#admin_view").hide();

    App.contracts.P2pi.deployed().then(function(instance) {
      p2pInstance = instance;
      return instance.owner();
    }).then(function(_owner){
      if(_owner == App.account){
        //console.log(p2pInstance.memberCount());
        return p2pInstance.memberCount();
      }
      return false;
    }).then(function(cnt){
      if(cnt){
        App.memberCount = cnt.toNumber();
        $("#admin_view").show();
        $("#member_list").html('');
        for(var i=1;i<App.memberCount;i++){
            App.get_member(i);
        }
      }
    });

    App.contracts.P2pi.deployed().then(function(instance) {
      return instance.numProposals();
    }).then(function(count){
      console.log(count);
      $("#proposal_list").html(' ');
      for(var i=0;i<count.toNumber();i++){
        App.get_proposals(i);
      }
    });
  },

  get_member:function(cnt){
    //console.log(App.memberCount);
    App.contracts.P2pi.deployed().then(function(instance) {
      return instance.members(cnt);
    }).then(function(_member){
      var approveButton = '<button class="btn btn-primary btn-xs" style="float:right;" onclick="App.approveMember(\''+_member[0]+'\')">Approve</button>';
      $("#member_list").append("<li class='list-group-item'>"+_member[1].toUpperCase()+" "+(_member[3]?'<span class="badge">Approved</span>':approveButton)+"</li>");
    });
  },
  get_proposals:function(cnt){
    var p2pInstance;
    var proposal;
    App.contracts.P2pi.deployed().then(function(instance) {
      p2pInstance = instance;
      return p2pInstance.proposals(cnt);
    }).then(function(_proposal){
      proposal = _proposal;
      return p2pInstance.checkIfPartOfProposal(cnt);
    }).then(function(isPart){
      if(isPart){
        var approveButton = '';
      }else{
        var approveButton = '<button class="btn btn-primary btn-xs" style="float:right;" onclick="App.joinPorposal(\''+cnt+'\')">Join</button>';
      }
      $("#proposal_list").append("<li class='list-group-item'>"+proposal[3].toUpperCase()+" "+approveButton+"</li>");
    });
  },
  approveMember:function(_account){
    console.log(_account);
    App.contracts.P2pi.deployed().then(function(instance) {
      var memName = $("#memberName").val();
      return instance.approveMember(_account);
    }).then(function(result) {
      // Wait for votes to update
      $("#content").hide();
      $("#loader").show();
    }).catch(function(err) {
      console.error(err);
    });
  },
  createProposal:function(){
    var propName = $("#proposalName").val();
    var propDesc = $("#proposalDesc").val();
    var minAmt = $("#minAmount").val();

    App.contracts.P2pi.deployed().then(function(instance) {
      var memName = $("#memberName").val();
      return instance.newProposal(minAmt,propName,propDesc);
    }).then(function(result) {
      // Wait for votes to update
      $("#content").hide();
      $("#loader").show();
    }).catch(function(err) {
      console.error(err);
    });
  },
  joinPorposal:function(_proposalId){
    App.contracts.P2pi.deployed().then(function(instance) {
      var memName = $("#memberName").val();
      return instance.joinPorposal(_proposalId);
    }).then(function(result) {
      console.log(result);
      // Wait for votes to update
      $("#content").hide();
      $("#loader").show();
    }).catch(function(err) {
      console.error(err);
    });
  }
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
