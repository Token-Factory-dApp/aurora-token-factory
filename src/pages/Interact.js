import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { ethers } from "ethers";
import { Button, Grid, TextField } from "@mui/material";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import contractAbi from "../contract/abi.json";

function Interact() {
  const MAINNET_ID = "0x4e454152";
  const TESTNET_ID = "0x4e454153";
  const MAINNET_BASE_URL = "https://explorer.mainnet.aurora.dev";
  const TESTNET_BASE_URL = "https://explorer.testnet.aurora.dev";

  const CHAIN_ID = TESTNET_ID;
  const BASE_URL = TESTNET_BASE_URL;

  const [funcs, setFuncs] = useState([]);
  const [abi, setAbi] = useState();
  const [metadata, setMetadata] = useState();
  const [notFound, setNotFound] = useState(false);
  const addressRef = useRef();
  const history = useNavigate();
  const { contractAddress } = useParams();

  useEffect(() => {
    if (contractAddress) {
      getTokenInfo();
      getAbi();
    } else {
      setMetadata();
        setAbi();
        setFuncs([]);
        setNotFound(false);
      }
    }, [contractAddress]);


  async function requestAccount() {
    if (window.ethereum.chainId !== CHAIN_ID) {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: CHAIN_ID }],
      });
    }

    await window.ethereum.request({ method: "eth_requestAccounts" });
  }


  async function getTokenInfo() {
    try {
      const response = await axios.get(
        `${BASE_URL}/api?module=token&action=getToken&contractaddress=${contractAddress}`
      );

      if (response.data?.result) {
        setMetadata(response.data.result);
        setNotFound(false);
      } else {
        console.log(response);
        setNotFound(true);
      }
    } catch (err) {
      console.log("Error: ", err);
    }
  }


  async function getAbi() {
    setAbi(contractAbi);
    getContractFunctions(contractAbi);
    return

    try {
      const response = await axios.get(
        `${BASE_URL}/api?module=contract&action=getabi&address=${contractAddress}`
      );

      if (response.data?.result) {
        setAbi(JSON.parse(response.data.result));
        getContractFunctions(JSON.parse(response.data.result));
      } else {
        console.log(response);
      }
    } catch (err) {
      console.log("Error: ", err);
    }
  }


  function getContractFunctions(abi) {
    setFuncs([]);

    const abiFunctions = abi.filter(element => element.type === "function")
      .sort((a, b) => a.stateMutability === "view" ? 1 : -1);

    abiFunctions.forEach((element) => {
      if (element.type === "function") {
        let func = `${element.name}(`;
        element.inputs.forEach((input, index) => {
          func += `${input.type} ${input.name}`;
          if (index < element.inputs.length - 1) {
            func += ", ";
          }
        });
        func += "): ";
        if (element.outputs.length) {
          element.outputs.forEach((output, index) => {
            func += output.type;
            if (index < element.outputs.length - 1) {
              func += ", ";
            }
          });
        } else {
          func += "void";
        }

        setFuncs((currArray) => [...currArray, element]);
      }
    });
  }


  function inputChange(event) {
    const funcName = event.target.name.split("-")[0];
    const inputName = event.target.name.split("-")[1];
    const inputValue = event.target.value;

    const func = funcs.find((func) => func.name === funcName);
    func.inputs.find((input) => input.name === inputName).value = inputValue;
  }


  async function execute(event) {
    const func = funcs.find((func) => func.name === event.target.name);
    const inputValues = [];
    func.inputs.forEach((input) => {
      inputValues.push(input.value);
    });

    if (typeof window.ethereum !== "undefined") {
      await requestAccount();
      const provider = new ethers.providers.Web3Provider(window.ethereum);

      try {
        const contract = new ethers.Contract(
          contractAddress,
          abi,
          provider.getSigner()
        );

        const res = await contract[func.name].apply(this, inputValues);
      } catch (err) {
        console.log("Error: ", err);
      }
    } else {
      console.log("Metamask not connected.");
    }
  }


  function search() {
    if (addressRef.current.value) {
      history("/Interact/" + addressRef.current.value);
    }
  }


  return (
    <div className="interact">
      <h1>Interact</h1>

      {metadata ? (
        <div>
          <div>
            <span>Contact address: </span>
            <span>{contractAddress}</span>
          </div>
          <div>
            <span>Name: </span>
            <span>{metadata.name}</span>
          </div>
          <div>
            <span>Symbol: </span>
            <span>{metadata.symbol}</span>
          </div>
          <div>
            <span>Type: </span>
            <span>{metadata.type}</span>
          </div>
          <div>
            <span>Total supply: </span>
            <span>{metadata.totalSupply}</span>
          </div>
          <div>
            <span>Decimals: </span>
            <span>{metadata.decimals}</span>
          </div>
          <a
            target="_blank"
            href={`${BASE_URL}/address/${contractAddress}/contracts`}
          >
            View in explorer
          </a>
        </div>
      ) : (
        <div>
          <Grid xs={12} item>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              onClick={search}
            >
              Search
            </Button>
            <TextField
              inputRef={addressRef}
              label="Contract address"
              placeholder="e.g. 0xabc123abc123abc123abc123abc123abc123abc1"
              variant="outlined"
              size="small"
            />
          </Grid>
          {notFound && (
            <span>Token not found for contact address {contractAddress}.</span>
          )}
        </div>
      )}

      {funcs.map((func) => (
        <Grid xs={12} item key={func.name} name={func.name} className="functions">
          <Button
            type="submit"
            variant="contained"
            color={func.stateMutability === "view" ? "primary" : "secondary"}
            name={func.name}
            onClick={execute}
            key={func.name}
          >
            {func.name}
          </Button>
          {func.inputs.map((input) => (
            <TextField
              label={`${input.name}: ${input.type}`}
              placeholder={`${input.name}: ${input.type}`}
              variant="outlined"
              size="small"
              name={`${func.name}-${input.name}`}
              onChange={inputChange}
              key={input.name}
              className="argument"
            />
          ))}
        </Grid>
      ))}
    </div>
  );
}

export default Interact;
