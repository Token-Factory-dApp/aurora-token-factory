import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { ethers } from "ethers";
import { Button, Grid, TextField } from "@mui/material";
import { Divider } from "@material-ui/core";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CircularProgress from "@mui/material/CircularProgress";
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
  const CHAIN_ID = MAINNET_ID;
  const BASE_URL = MAINNET_BASE_URL;
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
    try {
      if (window.ethereum.chainId !== CHAIN_ID) {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: CHAIN_ID }],
        });
      }
      await window.ethereum.request({ method: "eth_requestAccounts" });
    } catch (err) {
      throw new Error(err.message);
    }
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
      try {
        await requestAccount();
        const provider = new ethers.providers.Web3Provider(window.ethereum);

        func.response = { type: "loading" };
        setAbiFuncs([...abiFuncs]);

        const contract = new ethers.Contract(
          contractAddress,
          abiFuncs,
          provider.getSigner()
        );

        const res = await contract[func.name].apply(this, inputValues);

        if (typeof res === "object") {
          if (res._hex) {
            func.response = { type: "text", value: parseInt(res._hex, 16) };
          } else if (res.hash) {
            func.response = { type: "hash", value: res.hash };
          } else {
            func.response = {};
            setAlert({
              type: "error",
              msg: "An error has occurred.",
            });
          }
        } else {
          func.response = { type: "text", value: res };
        }
      } catch (err) {
        func.response = {};

        if (err.code === 4001) {
          setAlert({ type: "info", msg: "Operation canceled by user." });
        } else if (err.message) {
          setAlert({ type: "error", msg: getErrorMessage(err.message) });
        } else {
          setAlert({
            type: "error",
            msg: "An error has occurred.",
          });
        }
      }
    } else {
      func.response = {};
      setAlert({ type: "error", msg: "Connect to your Metamask extension." });
    }

    setAbiFuncs([...abiFuncs]);
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

  /**
   * Util to get error message from response.
   */
  function getErrorMessage(message) {
    if (message.startsWith("[ethjs-query] while formatting outputs from RPC")) {
      const extractMsg = JSON.parse(
        message.substring(message.indexOf("{"), message.lastIndexOf("}") + 1)
      ).value?.data?.message;
      return extractMsg ? extractMsg : "An error has occurred.";
    }

    return message;
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
                <span>View contract in explorer</span>
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
                className={
                  input.type === "address" ? "argument address" : "argument"
                }
              />
            ))}
          </div>
          <div className="response">
            {func.response?.type && func.response.type === "text" && (
              <span>{func.response.value}</span>
            )}
            {func.response?.type && func.response.type === "hash" && (
              <span>tx hash: {func.response.value}</span>
            )}
            {func.response?.type && func.response.type === "loading" && (
              <CircularProgress color="secondary" className="spinner" />
            )}
          </div>
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
