import {
    useActiveClaimConditionForWallet,
    useAddress,
    useClaimConditions,
    useClaimerProofs,
    useClaimIneligibilityReasons,
    useContract,
    useContractMetadata,
    useTotalCirculatingSupply,
    Web3Button,
  } from "@thirdweb-dev/react";
  import { BigNumber, utils } from "ethers";
  import type { NextPage } from "next";
  import { useMemo, useEffect, useState, useRef } from "react";
  import styles from "../styles/Theme.module.css";
  import { parseIneligibility } from "../utils/parseIneligibility";
  
  // Put Your Edition Drop Contract address from the dashboard here
  const myEditionDropContractAddress =
    "0xa048B62EC2ec1F3eb09de4dA47062C025CA715c1";
  
  // Put your token ID here
  const tokenId = 0;

  // Max
  const maxDegrees = 90;
  
  const Home: NextPage = () => {
    const cardRef = useRef<HTMLImageElement>(null);
    const address = useAddress();
    const [quantity, setQuantity] = useState(1);
    const { contract: editionDrop } = useContract(myEditionDropContractAddress);
    const { data: contractMetadata } = useContractMetadata(editionDrop);
  
    const claimConditions = useClaimConditions(editionDrop);
    const activeClaimCondition = useActiveClaimConditionForWallet(
      editionDrop,
      address,
      tokenId
    );
    const claimerProofs = useClaimerProofs(editionDrop, address || "", tokenId);
    const claimIneligibilityReasons = useClaimIneligibilityReasons(
      editionDrop,
      {
        quantity,
        walletAddress: address || "",
      },
      tokenId
    );
  
    const claimedSupply = useTotalCirculatingSupply(editionDrop, tokenId);
  
    const totalAvailableSupply = useMemo(() => {
      try {
        return BigNumber.from(activeClaimCondition.data?.availableSupply || 0);
      } catch {
        return BigNumber.from(1_000_000);
      }
    }, [activeClaimCondition.data?.availableSupply]);
  
    const numberClaimed = useMemo(() => {
      return BigNumber.from(claimedSupply.data || 0).toString();
    }, [claimedSupply]);
  
    const numberTotal = useMemo(() => {
      const n = totalAvailableSupply.add(BigNumber.from(claimedSupply.data || 0));
      if (n.gte(1_000_000)) {
        return "";
      }
      return n.toString();
    }, [totalAvailableSupply, claimedSupply]);
  
    const priceToMint = useMemo(() => {
      const bnPrice = BigNumber.from(
        activeClaimCondition.data?.currencyMetadata.value || 0
      );
      return `${utils.formatUnits(
        bnPrice.mul(quantity).toString(),
        activeClaimCondition.data?.currencyMetadata.decimals || 18
      )} ${activeClaimCondition.data?.currencyMetadata.symbol}`;
    }, [
      activeClaimCondition.data?.currencyMetadata.decimals,
      activeClaimCondition.data?.currencyMetadata.symbol,
      activeClaimCondition.data?.currencyMetadata.value,
      quantity,
    ]);
  
    const maxClaimable = useMemo(() => {
      let bnMaxClaimable;
      try {
        bnMaxClaimable = BigNumber.from(
          activeClaimCondition.data?.maxClaimableSupply || 0
        );
      } catch (e) {
        bnMaxClaimable = BigNumber.from(1_000_000);
      }
  
      let perTransactionClaimable;
      try {
        perTransactionClaimable = BigNumber.from(
          activeClaimCondition.data?.maxClaimablePerWallet || 0
        );
      } catch (e) {
        perTransactionClaimable = BigNumber.from(1_000_000);
      }
  
      if (perTransactionClaimable.lte(bnMaxClaimable)) {
        bnMaxClaimable = perTransactionClaimable;
      }
  
      const snapshotClaimable = claimerProofs.data?.maxClaimable;
  
      if (snapshotClaimable) {
        if (snapshotClaimable === "0") {
          // allowed unlimited for the snapshot
          bnMaxClaimable = BigNumber.from(1_000_000);
        } else {
          try {
            bnMaxClaimable = BigNumber.from(snapshotClaimable);
          } catch (e) {
            // fall back to default case
          }
        }
      }
  
      let max;
      if (totalAvailableSupply.lt(bnMaxClaimable)) {
        max = totalAvailableSupply;
      } else {
        max = bnMaxClaimable;
      }
  
      if (max.gte(1_000_000)) {
        return 1_000_000;
      }
      return max.toNumber();
    }, [
      claimerProofs.data?.maxClaimable,
      totalAvailableSupply,
      activeClaimCondition.data?.maxClaimableSupply,
      activeClaimCondition.data?.maxClaimablePerWallet,
    ]);
  
    const isSoldOut = useMemo(() => {
      try {
        return (
          (activeClaimCondition.isSuccess &&
            BigNumber.from(activeClaimCondition.data?.availableSupply || 0).lte(
              0
            )) ||
          numberClaimed === numberTotal
        );
      } catch (e) {
        return false;
      }
    }, [
      activeClaimCondition.data?.availableSupply,
      activeClaimCondition.isSuccess,
      numberClaimed,
      numberTotal,
    ]);
  
    const canClaim = useMemo(() => {
      return (
        activeClaimCondition.isSuccess &&
        claimIneligibilityReasons.isSuccess &&
        claimIneligibilityReasons.data?.length === 0 &&
        !isSoldOut
      );
    }, [
      activeClaimCondition.isSuccess,
      claimIneligibilityReasons.data?.length,
      claimIneligibilityReasons.isSuccess,
      isSoldOut,
    ]);
  
    const isLoading = useMemo(() => {
      return (
        activeClaimCondition.isLoading || claimedSupply.isLoading || !editionDrop
      );
    }, [activeClaimCondition.isLoading, editionDrop, claimedSupply.isLoading]);
  
    const buttonLoading = useMemo(
      () => isLoading || claimIneligibilityReasons.isLoading,
      [claimIneligibilityReasons.isLoading, isLoading]
    );
    const buttonText = useMemo(() => {
      if (isSoldOut) {
        return "Sold Out";
      }
  
      if (canClaim) {
        const pricePerToken = BigNumber.from(
          activeClaimCondition.data?.currencyMetadata.value || 0
        );
        if (pricePerToken.eq(0)) {
          return "Mint (Free)";
        }
        return `Mint (${priceToMint})`;
      }
      if (claimIneligibilityReasons.data?.length) {
        return parseIneligibility(claimIneligibilityReasons.data, quantity);
      }
      if (buttonLoading) {
        return "Checking eligibility...";
      }
  
      return "Claiming not available";
    }, [
      isSoldOut,
      canClaim,
      claimIneligibilityReasons.data,
      buttonLoading,
      activeClaimCondition.data?.currencyMetadata.value,
      priceToMint,
      quantity,
    ]);

    useEffect(() => {
        window.onmousemove = function (event) {
          if (!cardRef.current) return;
          var mouseX = event.pageX / window.innerWidth;
          var mouseY = event.pageY / window.innerHeight;
          var yDegrees = mouseX * maxDegrees - 0.5 * maxDegrees;
          var xDegrees = -0.5 * (mouseY * maxDegrees - 0.5 * maxDegrees);
    
          cardRef.current.style.transform =
            "rotateY(" + yDegrees + "deg) rotateX(" + xDegrees + "deg)";
        };
      }, []);
  
    return (
      <div className={styles.container}>
        <div className={styles.mintInfoContainer}>
          {isLoading ? (
            <p>Loading...</p>
          ) : (
            <>
              <div className={styles.infoSide}>
            <a href="https://heroesuprising.com" target="_blank" rel="noreferrer">
              <img
                ref={cardRef}
                src="/logohur.png"
                alt="Heroes Uprising Logo"
                width={250}
                className={styles.buttonGapTop}
              />
            </a>
            {/* Title of your NFT Collection */}
            <h1>HUVERSE Pass (HUVP)</h1>
            {/* Description of your NFT Collection */}
            <p className={styles.description}>
            A unique <b>non-fungible token</b> pass for Heroes Uprising community members to enter a special realm called <b>HUVERSE</b>.<br/><br/>
              <a href="https://docs.heroesuprising.com/game-economy-tokens-sale-and-funds-information/access-pass" target="_blank" rel="noreferrer" className={styles.link}>
                <b>Already have a HUVERSE Pass?</b>
              </a> 
            </p>
          </div>
  
              <div className={styles.imageSide}>
                {/* Image Preview of NFTs */}
                <img
                    className={styles.image}
                    src="/HUVERSE-Pass.png"
                    alt="HUVERSE-Pass"
                    width={250}
                />
  
                {/* Amount claimed so far */}
                <div className={styles.mintCompletionArea}>
                  <div className={styles.mintAreaLeft}>
                    <p>Total Minted</p>
                  </div>
                  <div className={styles.mintAreaRight}>
                    {claimedSupply ? (
                      <p>
                        <b>{numberClaimed}</b>
                        {" / "}
                        {numberTotal || "∞"}
                      </p>
                    ) : (
                      // Show loading state if we're still loading the supply
                      <p>Loading...</p>
                    )}
                  </div>
                </div>
  
                {claimConditions.data?.length === 0 ||
                claimConditions.data?.every(
                  (cc) => cc.maxClaimableSupply === "0"
                ) ? (
                  <div>
                    <h2>
                      This minting phase is closed (Wait for further announcement)
                    </h2>
                  </div>
                ) : (
                  <>
  
                    <div className={styles.mintContainer}>
                      {isSoldOut ? (
                        <div>
                          <h2>Sold Out</h2>
                        </div>
                      ) : (
                        <Web3Button
                          contractAddress={editionDrop?.getAddress() || ""}
                          action={(cntr) => cntr.erc1155.claim(tokenId, quantity)}
                          isDisabled={!canClaim || buttonLoading}
                          onError={(err) => {
                            console.error(err);
                            alert("Error minting a Pass");
                          }}
                          onSuccess={() => {
                            setQuantity(1);
                            alert("Successfully minted a Pass");
                          }}
                        >
                          {buttonLoading ? "Loading..." : buttonText}
                        </Web3Button>
                      )}
                    </div>
                    <p className={styles.notice}>
                    You only need one HUVERSE pass of each type <br/><strong>(Community & Warrior Pass)</strong>.<br/><br/>
  
                    HUVERSE Pass are not tradable and transferable. ⚠️
                  </p>
                  </>
                )}
              </div>
            </>
          )}
        </div>
         {/* Powered by thirdweb & Polygon */}{" "}
<div className={styles.partnerImageContainer}>
        <img
          src={`/logo.png`}
          alt="Thirdweb Logo"
          width={135}
          className={styles.buttonGapTop}
        />
        <img
          src={`/polygon.png`}
          alt="Polygon Logo"
          width={135}
          className={styles.buttonGapTop}
        />
        </div>
      </div>
    );
  };
  
  export default Home;
  