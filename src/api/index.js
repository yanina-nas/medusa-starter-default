import { Router } from "express"
import bodyParser from "body-parser"

export default () => {
  const router = Router()

  router.post("/slack/products", bodyParser.urlencoded(), async (req, res) => {
    const myService = req.scope.resolve("proService")

    const { text = "" } = req.body;
    const params = text.split(" ").map(Number);
    const offset = isNaN(params[0]) ? 0 : params[0];
    const limit = isNaN(params[1]) ? 10 : params[1];

    
    const divider = { "type": "divider" };
    
    const header = {
			"type": "header",
			"text": {
				"type": "plain_text",
				"text": "Products:"
			}
		}

    const products = await myService.getProducts(offset, limit);
    
    const blocks = [
        header,
        {
          "type": "section",
          "text": {
            "type": "plain_text",
            "text": "Type `/product [handle]` to get product details.",
            "emoji": true
          }
        },
        ...products.flatMap((product) => ([
            divider,
            {
              "type": "section",
              "text": {
                "type": "mrkdwn",
                "text": `*${product.title}* \n*Handle*: ${product.handle} \n*Description*: ${product.description}`
              },
              "accessory": {
                "type": "image",
                "image_url": `${product.thumbnail}`,
                "alt_text": `${product.title}`
              }
            },
            divider,
        ]))
    ]

    res.json({ blocks })
  })

  router.post("/start", async (req, res) => {


    res.json({
      "blocks": [
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": "Hello 👋  I'm Medusa Bot. I'm here to help you manage your Medusa shop in Slack.\nThat's how you can get started:"
          }
        },
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": "*1️⃣ Use the `/medusa/products [offset] [limit]` command*. That will load all the product entries from your medusa shop. Provide offset and limit to limit product range."
          }
        },
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": "*2️⃣ Use the `/medusa/product <handle>` command to get product details.* Try it out by typing `/medusa/product` command followed by product handle."
          }
        },
        {
          "type": "divider"
        },
        {
          "type": "context",
          "elements": [
            {
              "type": "mrkdwn",
              "text": "👀 View product count with `/medusa/total`"
            }
          ]
        }
      ]
    })
  })

  router.post("/slack/products/total", async (req, res) => {
    const productService = req.scope.resolve("productService")
  
    const count = await productService.count();

    res.json({
      "blocks": [
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": `*Total: ${count}*`
          }
        }
      ]
    });
  })

  router.post("/slack/product_by_handle", bodyParser.urlencoded(), async (req, res) => {
    const { text = "" } = req.body;

    const fail_response_body = {
      "blocks": [
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": `*No handle was provided.*`
          }
        }
      ]
    };

    if (text === "") {
      res.json(fail_response_body);
    }

    const productService = req.scope.resolve("productService")

    const defaultRelations = [
      "variants",
      "variants.prices",
      "variants.options",
      "images",
    ]

    try {
      const response = await productService.retrieveByHandle(text, { relations: defaultRelations })
    
      console.log(response);
  
      res.json({
        "blocks": [
          {
            "type": "header",
            "text": {
              "type": "plain_text",
              "text": `${response.title}`,
              "emoji": true
            }
          },
          {
            "type": "section",
            "fields": [
              {
                "type": "mrkdwn",
                "text": `*Product id:*\n${response.id}`
              },
              {
                "type": "mrkdwn",
                "text": `*Inventory quantity:*\n${response.variants[0]?.inventory_quantity || ""}`
              },
              {
                "type": "mrkdwn",
                "text": `*Added on:*\n${new Date(response.variants[0]?.created_at).toLocaleDateString("en-US") || ""}`
              },
              {
                "type": "mrkdwn",
                "text": `*Price:*\n${response.variants[0]?.prices?.map(({ amount, currency_code }) => (`${amount} ${currency_code}`)).join(" | ") || ""}`
              }
            ]
          },
          {
            "type": "image",
            "image_url": `${response.thumbnail}`,
            "alt_text": `${response.title}`
          }
        ]
      });
    }
    catch (error) {
      res.json(fail_response_body);
    }

  })


  return router;
}
