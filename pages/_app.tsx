import type { AppProps } from "next/app";
import { ChainId, ThirdwebProvider } from "@thirdweb-dev/react";
import "../styles/globals.css";
import Head from "next/head";

// This is the chainId your dApp will work on.
const activeChainId = ChainId.Polygon;

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ThirdwebProvider desiredChainId={activeChainId}

    >
      <Head>
        <title>HUVERSE Pass</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta
          name="description"
          content="Mint your HUVERSE Pass to access exclusive features on HUVERSE."
        />
        <meta
          name="keywords"
          content="Heroes Uprising, NFT, Community Pass, HUVERSE, heroesuprising, minting"
        />
        {/* Facebook */}
        <meta property="og:url" content="https://docs.heroesuprising.com/game-economy-tokens-sale-and-funds-information/access-pass"/>
        <meta property="og:type" content="website"/>
        <meta property="og:title" content="HUVERSE Pass"/>
        <meta property="og:description" content="Mint your HUVERSE Pass to access exclusive features on HUVERSE."/>
        <meta property="og:image" content="/preview.png"/>
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image"/>
        <meta property="twitter:domain" content="docs.heroesuprising.com/game-economy-tokens-sale-and-funds-information/access-pass"/>
        <meta property="twitter:url" content="https://docs.heroesuprising.com/game-economy-tokens-sale-and-funds-information/access-pass"/>
        <meta name="twitter:title" content="HUVERSE Pass"/>
        <meta name="twitter:description" content="Mint your HUVERSE Pass to access exclusive features on HUVERSE."/>
        <meta name="twitter:image" content="/preview.png"/>
      </Head>
      <Component {...pageProps} />
    </ThirdwebProvider>
  );
}

export default MyApp;
