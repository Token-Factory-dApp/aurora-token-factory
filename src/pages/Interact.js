import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { ethers } from "ethers";
import { Button, Grid, TextField } from "@mui/material";
import { Divider } from "@material-ui/core";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import LaunchRoundedIcon from "@mui/icons-material/LaunchRounded";
import Alert from "@mui/material/Alert";
import CloseIcon from "@mui/icons-material/Close";
import IconButton from "@mui/material/IconButton";
import contractAbi from "../contract/abi.json";

function Interact() {
  /**
   * Constants
   */
  const MAINNET_ID = "0x4e454152";
  const TESTNET_ID = "0x4e454153";
  const MAINNET_BASE_URL = "https://explorer.mainnet.aurora.dev";
  const TESTNET_BASE_URL = "https://explorer.testnet.aurora.dev";
  const CHAIN_ID = TESTNET_ID;
  const BASE_URL = TESTNET_BASE_URL;
  const [abiFuncs, setAbiFuncs] = useState([]);
  const [metadata, setMetadata] = useState();
  const [notFound, setNotFound] = useState(false);
  const [alert, setAlert] = useState();
  const addressRef = useRef();
  const history = useNavigate();
  const { contractAddress } = useParams();

  /**
   * On compenent load, gets token data if an address is supplied
   */
  useEffect(() => {
    setMetadata();
    setAbiFuncs([]);
    setNotFound(false);

    if (contractAddress) {
      getTokenInfo();
    }
  }, [contractAddress]);

  /**
   * Requests for Metamask account
   */
  async function requestAccount() {
    if (window.ethereum.chainId !== CHAIN_ID) {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: CHAIN_ID }],
      });
    }

    await window.ethereum.request({ method: "eth_requestAccounts" });
  }

  /**
   * Gets token data
   */
  async function getTokenInfo() {
    try {
      const response = await axios.get(
        `${BASE_URL}/api?module=token&action=getToken&contractaddress=${contractAddress}`
      );

      if (response.data?.result) {
        setMetadata(response.data.result);
        setNotFound(false);
        if (response.data.result.type === "ERC-20") {
          getContractFunctions(contractAbi);
        }
      } else {
        console.log(response);
        setNotFound(true);
      }
    } catch (err) {
      console.log("Error: ", err);
    }
  }

  /**
   * Gets contact ABI (contract must be verified)
   * TODO Currently the contract functions are extrated by an static ABI.
   *      In the future we can use this method to get the ABI dynamically from a verified cotract,
   *      in order to support different contract structures.
   */
  // async function getAbi() {
  //   try {
  //     const response = await axios.get(
  //       `${BASE_URL}/api?module=contract&action=getabi&address=${contractAddress}`
  //     );

  //     if (response.data?.result) {
  //       getContractFunctions(JSON.parse(response.data.result));
  //     } else {
  //       console.log(response);
  //     }
  //   } catch (err) {
  //     console.log("Error: ", err);
  //   }
  // }

  /**
   * Gets contract functions out of its ABI
   */
  function getContractFunctions(abi) {
    const abiFunctions = abi
      .filter((element) => element.type === "function")
      .sort((a, b) => (a.stateMutability === "view" ? 1 : -1))
      .map((element) => {
        return { ...element };
      });

    setAbiFuncs(abiFunctions);
  }

  /**
   * Detects a change in one of the function inputs and sets the new value
   * in 'abiFuncs'
   */
  function inputChange(event) {
    const funcName = event.target.name.split("-")[0];
    const inputName = event.target.name.split("-")[1];
    const inputValue = event.target.value;

    const func = abiFuncs.find((func) => func.name === funcName);
    func.inputs.find((input) => input.name === inputName).value = inputValue;
  }

  /**
   * Executes one function of the contract
   */
  async function execute(event) {
    const func = abiFuncs.find((func) => func.name === event.target.name);
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
          abiFuncs,
          provider.getSigner()
        );

        const res = await contract[func.name].apply(this, inputValues);

        func.response =
          typeof res === "object"
            ? res._hex
              ? parseInt(res._hex, 16)
              : "Error getting response"
            : res;

        setAbiFuncs([...abiFuncs]);
      } catch (err) {
        if (err.code === 4001) {
          setAlert({ type: "info", msg: "Operation canceled by user." });
        } else if (err.message) {
          setAlert({ type: "error", msg: err.message });
        } else {
          setAlert({
            type: "error",
            msg: "An error has occurred in the creation of your token.",
          });
        }
      }
    } else {
      setAlert({ type: "error", msg: "Connect to your Metamask extension." });
    }
  }

  /**
   * Searches for a token, given a new contract address.
   * To do so, the component is reloaded.
   */
  function search() {
    if (addressRef.current.value) {
      history("/Interact/" + addressRef.current.value);
    }
  }

  return (
    <div className="interact">
      <h1>Interact with Smart Contract</h1>

      {metadata ? (
        <Card className="metadata-card">
          <CardContent>
            <div>
              <span className="label">Contact address:</span>
              <span>{contractAddress}</span>
            </div>
            <div>
              <span className="label">Name:</span>
              <span>{metadata.name}</span>
            </div>
            <div>
              <span className="label">Symbol:</span>
              <span>{metadata.symbol}</span>
            </div>
            <div>
              <span className="label">Type:</span>
              <span>{metadata.type}</span>
            </div>
            <div>
              <span className="label">Total supply:</span>
              <span>{metadata.totalSupply}</span>
            </div>
            <div>
              <span className="label">Decimals:</span>
              <span>{metadata.decimals}</span>
            </div>
            <div className="link-container">
              <a
                target="_blank"
                rel="noreferrer"
                href={`${BASE_URL}/address/${contractAddress}/contracts`}
                className="link"
              >
                <span>View in explorer</span>
                <LaunchRoundedIcon fontSize="small" />
              </a>
            </div>
            {metadata.type !== "ERC-20" && (
              <div>
                Currently only interaction with ERC-20 tokens is supported.
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="search">
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
              className="input"
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

      {abiFuncs.map((func) => (
        <div key={func.name} name={func.name} className="function">
          <div>
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
          </div>
          <div className="response">{func.response}</div>
          <Divider />
        </div>
      ))}

      {alert && (
        <Alert
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={() => {
                setAlert();
              }}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          }
          variant="filled"
          severity={alert.type}
          sx={{ mt: 3 }}
        >
          {alert.msg}
        </Alert>
      )}
    </div>
  );
}

export default Interact;
