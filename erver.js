[1mdiff --cc server.js[m
[1mindex 5f51664,1c6d0ac..0000000[m
[1m--- a/server.js[m
[1m+++ b/server.js[m
[36m@@@ -1197,22 -1197,6 +1197,25 @@@[m [mapp.get("/auth/facebook/callback", asyn[m
   [m
      console.log("Facebook token received and save attempted");[m
   [m
[32m++<<<<<<< HEAD[m
[32m +[m
[32m +    facebookConnection = {[m
[32m +[m
[32m +      connected: true,[m
[32m +[m
[32m +      token:[m
[32m +        tokenData.access_token,[m
[32m +[m
[32m +      expiresIn:[m
[32m +        tokenData.expires_in,[m
[32m +[m
[32m +      connectedAt:[m
[32m +        new Date().toISOString(),[m
[32m +[m
[32m +    };[m
[32m +[m
[32m++=======[m
[32m++>>>>>>> eb07158 (Enhance Facebook connection management and logging)[m
      console.log([m
        "Facebook Connected Successfully"[m
      );[m
[36m@@@ -1503,49 -1487,27 +1506,52 @@@[m [mapp.post("/instagram/post", async (req[m
  });[m
   [m
  // PASTE THE NEW ROUTE HERE[m
[32m++<<<<<<< HEAD[m
[32m +app.get("/facebook/test", (req, res) => {[m
[32m +  res.json({[m
[32m +    connected: facebookConnection.connected,[m
[32m +    connectedAt: facebookConnection.connectedAt || null,[m
[32m +    hasToken: Boolean(facebookConnection.token),[m
[32m +  });[m
[32m +});[m
[32m + [m
[32m +app.get("/x/credentials-check", (req, res) => {[m
[32m +  res.json({[m
[32m +    connected: true,[m
[32m +    hasClientId: Boolean(process.env.X_CLIENT_ID),[m
[32m +    hasClientSecret: Boolean(process.env.X_CLIENT_SECRET),[m
[32m +    hasApiKey: Boolean(process.env.X_API_KEY),[m
[32m +    hasApiSecret: Boolean(process.env.X_API_SECRET),[m
[32m +    hasAccessToken: Boolean(process.env.X_ACCESS_TOKEN),[m
[32m +    hasAccessTokenSecret: Boolean(process.env.X_ACCESS_TOKEN_SECRET),[m
[32m +    message: "X credentials check complete.",[m
[32m +  });[m
[32m +});[m
[32m + [m
[32m +[m
[32m++=======[m
[32m++>>>>>>> eb07158 (Enhance Facebook connection management and logging)[m
  app.get("/facebook/test", (req, res) => {[m
[31m- [m
    res.json({[m
[31m- [m
[31m-     connected:[m
[31m-       facebookConnection.connected,[m
[31m- [m
[31m-     hasToken:[m
[31m-       Boolean([m
[31m-         facebookConnection.token[m
[31m-       ),[m
[31m- [m
[31m-     readyForPages:false,[m
[31m- [m
[31m-     message:[m
[31m-       "Facebook login works. Page publishing requires Meta Page permissions."[m
[31m- [m
[32m+     connected: facebookConnection.connected,[m
[32m+     connectedAt: facebookConnection.connectedAt || null,[m
[32m+     hasToken: Boolean(facebookConnection.token),[m
    });[m
[31m- [m
  });[m
[31m- [m
[32m+  [m
[32m+ app.get("/x/credentials-check", (req, res) => {[m
[32m+   res.json({[m
[32m+     connected: true,[m
[32m+     hasClientId: Boolean(process.env.X_CLIENT_ID),[m
[32m+     hasClientSecret: Boolean(process.env.X_CLIENT_SECRET),[m
[32m+     hasApiKey: Boolean(process.env.X_API_KEY),[m
[32m+     hasApiSecret: Boolean(process.env.X_API_SECRET),[m
[32m+     hasAccessToken: Boolean(process.env.X_ACCESS_TOKEN),[m
[32m+     hasAccessTokenSecret: Boolean(process.env.X_ACCESS_TOKEN_SECRET),[m
[32m+     message: "X credentials check complete.",[m
[32m+   });[m
[32m+ });[m
[32m+  [m
  app.get("/auth/pinterest/callback", async (req, res) => {[m
    try {[m
      const { code, state } = req.query;[m
[36m@@@ -1760,203 -1722,9 +1766,201 @@@[m [m${productLink || ""}`[m
    }[m
  [m
    return data;[m
[32m++<<<<<<< HEAD[m
[32m +}[m
[32m +[m
[32m +async function publishInstagramPost({ title, description, imageUrl }) {[m
[32m +  const instagramUserId = process.env.INSTAGRAM_USER_ID;[m
[32m +  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;[m
[32m +[m
[32m +  if (!instagramUserId || !accessToken) {[m
[32m +    throw new Error("Instagram not configured");[m
[32m +  }[m
[32m +[m
[32m +  if (!imageUrl) {[m
[32m +    throw new Error("Instagram requires an imageUrl to publish.");[m
[32m +  }[m
[32m +[m
[32m +  const message = `${title}[m
[32m +[m
[32m +${description}`;[m
[32m +[m
[32m +  const createContainerResponse = await fetch([m
[32m +    `https://graph.instagram.com/v23.0/${instagramUserId}/media`,[m
[32m +    {[m
[32m +      method: "POST",[m
[32m +      headers: { "Content-Type": "application/json" },[m
[32m +      body: JSON.stringify({[m
[32m +        image_url: imageUrl,[m
[32m +        caption: message,[m
[32m +        access_token: accessToken,[m
[32m +      }),[m
[32m +    }[m
[32m +  );[m
[32m +[m
[32m +  const createContainerData = await createContainerResponse.json();[m
[32m +[m
[32m +  if (createContainerData.error) {[m
[32m +    throw new Error(createContainerData.error.message);[m
[32m +  }[m
[32m +[m
[32m +  await new Promise((resolve) => setTimeout(resolve, 8000));[m
[32m +[m
[32m +  const publishResponse = await fetch([m
[32m +    `https://graph.instagram.com/v23.0/${instagramUserId}/media_publish`,[m
[32m +    {[m
[32m +      method: "POST",[m
[32m +      headers: { "Content-Type": "application/json" },[m
[32m +      body: JSON.stringify({[m
[32m +        creation_id: createContainerData.id,[m
[32m +        access_token: accessToken,[m
[32m +      }),[m
[32m +    }[m
[32m +  );[m
[32m +[m
[32m +  const publishData = await publishResponse.json();[m
[32m +[m
[32m +  if (publishData.error) {[m
[32m +    throw new Error(publishData.error.message);[m
[32m +  }[m
[32m +[m
[32m +  return publishData;[m
[32m +}[m
[32m +[m
[32m +async function publishXPost({ title, description, productLink, imageUrl }) {[m
[32m +  const message = `${title}[m
[32m +[m
[32m +${description}[m
[32m +[m
[32m +${productLink || ""}`.trim();[m
[32m +[m
[32m +  if (!message) {[m
[32m +    throw new Error("Missing X post message");[m
[32m +  }[m
[32m +[m
[32m +  const oauth = OAuth({[m
[32m +    consumer: {[m
[32m +      key: process.env.X_API_KEY,[m
[32m +      secret: process.env.X_API_SECRET,[m
[32m +    },[m
[32m +    signature_method: "HMAC-SHA1",[m
[32m +    hash_function(baseString, key) {[m
[32m +      return CryptoJS.HmacSHA1(baseString, key).toString(CryptoJS.enc.Base64);[m
[32m +    },[m
[32m +  });[m
[32m +[m
[32m +  const token = {[m
[32m +    key: process.env.X_ACCESS_TOKEN,[m
[32m +    secret: process.env.X_ACCESS_TOKEN_SECRET,[m
[32m +  };[m
[32m +[m
[32m +  const requestData = {[m
[32m +    url: "https://api.twitter.com/2/tweets",[m
[32m +    method: "POST",[m
[32m +  };[m
[32m +[m
[32m +  const authHeader = oauth.toHeader(oauth.authorize(requestData, token));[m
[32m +[m
[32m +  const response = await fetch(requestData.url, {[m
[32m +    method: "POST",[m
[32m +    headers: {[m
[32m +      ...authHeader,[m
[32m +      "Content-Type": "application/json",[m
[32m +    },[m
[32m +    body: JSON.stringify({[m
[32m +      text: message.slice(0, 280),[m
[32m +    }),[m
[32m +  });[m
[32m +[m
[32m +  const data = await response.json();[m
[32m +[m
[32m +  if (!response.ok) {[m
[32m +    console.log("X Scheduled Post Error:", data);[m
[32m +    throw new Error(JSON.stringify(data));[m
[32m +  }[m
[32m +[m
[32m +  return data;[m
[32m +}[m
[32m +[m
[32m +async function publishInstagramPost({[m
[32m +  title,[m
[32m +  description,[m
[32m +  productLink,[m
[32m +  imageUrl,[m
[32m +}) {[m
[32m +  const instagramUserId = process.env.INSTAGRAM_USER_ID;[m
[32m +  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;[m
[32m +[m
[32m +  if (!instagramUserId || !accessToken) {[m
[32m +    throw new Error("Instagram not configured");[m
[32m +  }[m
[32m +[m
[32m +  if (!imageUrl) {[m
[32m +    throw new Error("Instagram requires an imageUrl to publish.");[m
[32m +  }[m
[32m +[m
[32m +  const message = `[m
[32m +${title || ""}[m
[32m +[m
[32m +${description || ""}[m
[32m +[m
[32m +Tap the link in bio to learn more.[m
[32m +`;[m
[32m +[m
[32m +  const createContainerResponse = await fetch([m
[32m +    `https://graph.instagram.com/v23.0/${instagramUserId}/media`,[m
[32m +    {[m
[32m +      method: "POST",[m
[32m +      headers: {[m
[32m +        "Content-Type": "application/json",[m
[32m +      },[m
[32m +      body: JSON.stringify({[m
[32m +        image_url: imageUrl,[m
[32m +        caption: message,[m
[32m +        access_token: accessToken,[m
[32m +      }),[m
[32m +    }[m
[32m +  );[m
[32m +[m
[32m +  const createContainerData = await createContainerResponse.json();[m
[32m +[m
[32m +  if (createContainerData.error) {[m
[32m +    throw new Error(createContainerData.error.message || "Instagram container creation failed");[m
[32m +  }[m
[32m +[m
[32m +  await new Promise((resolve) => setTimeout(resolve, 8000));[m
[32m +[m
[32m +  const publishResponse = await fetch([m
[32m +    `https://graph.instagram.com/v23.0/${instagramUserId}/media_publish`,[m
[32m +    {[m
[32m +      method: "POST",[m
[32m +      headers: {[m
[32m +        "Content-Type": "application/json",[m
[32m +      },[m
[32m +      body: JSON.stringify({[m
[32m +        creation_id: createContainerData.id,[m
[32m +        access_token: accessToken,[m
[32m +      }),[m
[32m +    }[m
[32m +  );[m
[32m +[m
[32m +  const publishData = await publishResponse.json();[m
[32m +[m
[32m +  if (publishData.error) {[m
[32m +    throw new Error(publishData.error.message || "Instagram publish failed");[m
[32m +  }[m
[32m +[m
[32m +  return {[m
[32m +    success: true,[m
[32m +    platform: "instagram",[m
[32m +    creationId: createContainerData.id,[m
[32m +    result: publishData,[m
[32m +  };[m
[32m++=======[m
[32m++>>>>>>> eb07158 (Enhance Facebook connection management and logging)[m
  }[m
  [m
[31m- async function publishInstagramPost({[m
[31m-   title,[m
[31m-   description,[m
[31m-   productLink,[m
[31m-   imageUrl,[m
[31m- }) {[m
[32m+ async function publishInstagramPost({ title, description, imageUrl }) {[m
    const instagramUserId = process.env.INSTAGRAM_USER_ID;[m
    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;[m
  [m
[36m@@@ -2091,9 -1838,7 +2074,13 @@@[m [mapp.post("/schedule-campaign", async (r[m
    nextRunAt,[m
    repeatUntil,[m
  } = req.body;[m
[32m++<<<<<<< HEAD[m
[32m +[m
[32m +console.log("SCHEDULE REQUEST PLATFORM:", platform);[m
[32m +[m
[32m++=======[m
[32m+  [m
[32m++>>>>>>> eb07158 (Enhance Facebook connection management and logging)[m
      if (!title || !description || !publishAt) {[m
        return res.status(400).json({[m
          error: "Missing title, description, or publishAt.",[m
[36m@@@ -2337,17 -2082,6 +2324,20 @@@[m [masync function runScheduledCampaigns() [m
        let publishData = null;[m
   [m
  const platform = String(campaign.platform || "").trim().toLowerCase();[m
[32m++<<<<<<< HEAD[m
[32m +[m
[32m +console.log([m
[32m +  "SCHEDULER DEBUG:",[m
[32m +  "id =", campaign.id,[m
[32m +  "raw platform =", campaign.platform,[m
[32m +  "normalized =", platform[m
[32m +);[m
[32m +      console.log("SCHEDULER DEBUG platform:", campaign.platform);[m
[32m +console.log("SCHEDULER DEBUG id:", campaign.id);[m
[32m +[m
[32m +const platform = String(campaign.platform || "").toLowerCase();[m
[32m++=======[m
[32m++>>>>>>> eb07158 (Enhance Facebook connection management and logging)[m
  [m
  if (platform === "facebook") {[m
    publishData = await publishFacebookPost({[m
[36m@@@ -2360,28 -2094,6 +2350,31 @@@[m
  } else if (platform === "instagram") {[m
    console.log("Publishing Instagram campaign:", campaign.id);[m
  [m
[32m++<<<<<<< HEAD[m
[32m +  publishData = await publishInstagramPost({[m
[32m +    title: campaign.title,[m
[32m +    description: campaign.description,[m
[32m +    imageUrl: campaign.image_url,[m
[32m +  });[m
[32m +} else if (platform === "x") {[m
[32m +  console.log("Publishing X campaign:", campaign.id);[m
[32m +[m
[32m +  publishData = await publishXPost({[m
[32m +    title: campaign.title,[m
[32m +    description: campaign.description,[m
[32m +    productLink: campaign.product_link,[m
[32m +    imageUrl: campaign.image_url,[m
[32m +  });[m
[32m +} else {[m
[32m +  console.log([m
[32m +    "Publishing Pinterest campaign:",[m
[32m +    campaign.id,[m
[32m +    "platform =",[m
[32m +    campaign.platform[m
[32m +  );[m
[32m +[m
[32m++=======[m
[32m++>>>>>>> eb07158 (Enhance Facebook connection management and logging)[m
    publishData = await publishInstagramPost({[m
      title: campaign.title,[m
      description: campaign.description,[m
[36m@@@ -2396,9 -2114,6 +2395,12 @@@[m
      link: campaign.product_link,[m
      imageUrl: campaign.image_url,[m
    });[m
[32m++<<<<<<< HEAD[m
[32m +[m
[32m +} else {[m
[32m +  throw new Error(`Unsupported scheduled platform: ${campaign.platform}`);[m
[32m++=======[m
[32m++>>>>>>> eb07158 (Enhance Facebook connection management and logging)[m
  }[m
   [m
        const repeatType = campaign.repeat_type || "one_time";[m
[36m@@@ -2568,21 -2283,6 +2570,24 @@@[m [mIMPORTANT RULE[m
  - Do NOT use bullet points.[m
  - Do NOT wrap anything in quotes.[m
  - Do NOT mention that you analyzed the image.[m
[32m++<<<<<<< HEAD[m
[32m +[m
[32m +X HARD RULES[m
[32m +[m
[32m +When platform = X:[m
[32m +[m
[32m +- TITLE must be 60 characters or less.[m
[32m +- DESCRIPTION must be 120 characters or less.[m
[32m +- DESCRIPTION must be one short punchy sentence.[m
[32m +- HASHTAGS must contain exactly 3 hashtags.[m
[32m +- CTA must be blank.[m
[32m +- Do not use "link in bio".[m
[32m +- Do not include product links.[m
[32m +- Do not include URLs.[m
[32m +- Do not write long paragraphs.[m
[32m +- Do not use more than 3 hashtags.[m
[32m++=======[m
[32m++>>>>>>> eb07158 (Enhance Facebook connection management and logging)[m
   [m
  INSTAGRAM HARD RULES[m
   [m
[36m@@@ -2601,13 -2301,6 +2606,16 @@@[m [mWhen platform = Instagram[m
  - ".org" is forbidden.[m
  - ".shop" is forbidden.[m
  - ".store" is forbidden.[m
[32m++<<<<<<< HEAD[m
[32m +[m
[32m +- DESCRIPTION must be 2 to 4 complete sentences.[m
[32m +- DESCRIPTION must feel like a real Instagram caption, not a short product blurb.[m
[32m +- DESCRIPTION should be approximately 50 to 100 words.[m
[32m +- DESCRIPTION should tell a story or create excitement around the artwork rather than simply describing it.[m
[32m +- HASHTAGS must contain 12 to 15 hashtags.[m
[32m +- CTA must be one complete sentence using link-in-bio wording.[m
[32m++=======[m
[32m++>>>>>>> eb07158 (Enhance Facebook connection management and logging)[m
   [m
  The DESCRIPTION must contain zero links.[m
   [m
[36m@@@ -2672,9 -2365,7 +2680,13 @@@[m [mFocus on[m
   [m
  HASHTAGS:[m
   [m
[32m++<<<<<<< HEAD[m
[32m +For Instagram, generate exactly 12 to 15 highly relevant hashtags.[m
[32m +Each hashtag must be on its own line.[m
[32m +Mix broad art hashtags with niche artwork-specific hashtags.[m
[32m++=======[m
[32m+ Generate 10-15 strong hashtags for ${platform}.[m
[32m++>>>>>>> eb07158 (Enhance Facebook connection management and logging)[m
   [m
  Each hashtag must be on its own line.[m
   [m
[36m@@@ -3058,21 -2720,17 +3070,30 @@@[m [mFinal check[m
   [m
  app.listen(PORT, async () => {[m
  [m
[32m++<<<<<<< HEAD[m
[32m +  console.log(`Server running on port ${PORT}`);[m
[32m +  console.log(`Pinterest API base: ${PINTEREST_API_BASE}`);[m
[32m +[m
[32m +  await loadFacebookConnection();[m
[32m +[m
[32m +app.listen(PORT, () => {[m
[32m++=======[m
[32m++>>>>>>> eb07158 (Enhance Facebook connection management and logging)[m
    console.log(`Server running on port ${PORT}`);[m
    console.log(`Pinterest API base: ${PINTEREST_API_BASE}`);[m
[31m-   console.log("LIVE SERVER VERSION: SCHEDULER DEBUG 1");[m
[32m+ [m
[32m+   await loadFacebookConnection();[m
[32m+ [m
    console.log([m
      "Facebook saved connection loaded:",[m
      facebookConnection.connected[m
    );[m
  [m
[32m++<<<<<<< HEAD[m
[32m +  console.log("LIVE SERVER VERSION: INSTAGRAM LONG CAPTION FIX 1");[m
[32m++=======[m
[32m+   console.log("LIVE SERVER VERSION: INSTAGRAM DEBUG 2");[m
[32m++>>>>>>> eb07158 (Enhance Facebook connection management and logging)[m
  [m
    console.log([m
      `Stripe configured: ${[m
