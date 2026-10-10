/* Generated from seed.json so the prototype also runs from file:// (no fetch). Do not edit by hand: change seed.json
   and regenerate; tests/engine.test.js fails if the two differ. */
window.SEED = {
 "_note": "Invented but representative data for the Store Activation discovery. Every name, price and number is an example; GST rates and HSN codes are illustrative. Food and food-related products only. A product has a smallest unit and a bigger unit holding a whole number of them; the rate is quoted for one (rateUnit), the other is derived; taxIncl says whether the rate includes GST (\"\" = not said). Canonical file: seed.js mirrors it for file:// use (tests/engine.test.js checks they match).",
 "store": {
  "name": "Ramesh Traders",
  "owner": "Ramesh",
  "city": "Pune",
  "phone": "+91 98••• ••210",
  "mobile": "98220 47210",
  "gstin": "27ABCPR4821K1Z5"
 },
 "sources": {
  "file": {
   "label": "Rate list Oct.pdf",
   "rows": [
    {
     "name": "Glucose biscuit 100g",
     "baseUnit": "packet",
     "bigUnit": "carton",
     "perBig": "120",
     "rate": "480",
     "rateUnit": "carton",
     "gst": "5",
     "taxIncl": "",
     "mrp": "5",
     "hsn": "1905",
     "category": "biscuits"
    },
    {
     "name": "Chakki atta 10 kg",
     "baseUnit": "kg",
     "bigUnit": "bag",
     "perBig": "10",
     "rate": "4?0",
     "rateUnit": "bag",
     "gst": "0",
     "taxIncl": "",
     "mrp": "",
     "hsn": "1101",
     "category": "atta",
     "hint": {
      "rate": [
       "410",
       "470"
      ]
     }
    },
    {
     "name": "Sunflower oil 1 L",
     "baseUnit": "pouch",
     "bigUnit": "peti",
     "perBig": "12",
     "rate": "1860",
     "rateUnit": "peti",
     "gst": "5",
     "taxIncl": "",
     "mrp": "165",
     "hsn": "1512",
     "category": "oil"
    },
    {
     "name": "Masala noodles 70g",
     "baseUnit": "packet",
     "bigUnit": "carton",
     "perBig": "96",
     "rate": "1020",
     "rateUnit": "carton",
     "gst": "5",
     "taxIncl": "",
     "mrp": "14",
     "hsn": "1902",
     "category": "noodles"
    },
    {
     "name": "Marie biscuit 200g",
     "baseUnit": "packet",
     "bigUnit": "carton",
     "perBig": "36",
     "rate": "540",
     "rateUnit": "carton",
     "gst": "5",
     "taxIncl": "",
     "mrp": "30",
     "hsn": "1905",
     "category": "biscuits"
    },
    {
     "name": "Toor dal 1 kg",
     "baseUnit": "packet",
     "bigUnit": "bag",
     "perBig": "30",
     "rate": "3720",
     "rateUnit": "bag",
     "gst": "5",
     "taxIncl": "",
     "mrp": "160",
     "hsn": "0713",
     "category": "dal"
    },
    {
     "name": "",
     "baseUnit": "packet",
     "bigUnit": "bag",
     "perBig": "30",
     "rate": "1290",
     "rateUnit": "bag",
     "gst": "5",
     "taxIncl": "",
     "mrp": "48",
     "hsn": "1701",
     "category": "salt-sugar",
     "hint": {
      "name": [
       "Sugar 1 kg"
      ]
     }
    },
    {
     "name": "Tea 250g",
     "baseUnit": "packet",
     "bigUnit": "carton",
     "perBig": "",
     "rate": "4400",
     "rateUnit": "carton",
     "gst": "5",
     "taxIncl": "",
     "mrp": "140",
     "hsn": "0902",
     "category": "tea",
     "hint": {
      "perBig": [
       "40",
       "48"
      ]
     }
    },
    {
     "name": "Salt 1 kg",
     "baseUnit": "packet",
     "bigUnit": "bag",
     "perBig": "25",
     "rate": "520",
     "rateUnit": "bag",
     "gst": "0",
     "taxIncl": "",
     "mrp": "28",
     "hsn": "2501",
     "category": "salt-sugar"
    },
    {
     "name": "Rusk 300g",
     "baseUnit": "packet",
     "bigUnit": "carton",
     "perBig": "30",
     "rate": "1350",
     "rateUnit": "carton",
     "gst": "5",
     "taxIncl": "",
     "mrp": "55",
     "hsn": "1905",
     "category": "biscuits"
    },
    {
     "name": "Besan 500g",
     "baseUnit": "packet",
     "bigUnit": "carton",
     "perBig": "40",
     "rate": "1960",
     "rateUnit": "carton",
     "gst": "12",
     "taxIncl": "",
     "mrp": "60",
     "hsn": "1106",
     "category": "dal"
    },
    {
     "name": "Poha 500g",
     "baseUnit": "packet",
     "bigUnit": "",
     "perBig": "30",
     "rate": "1080",
     "rateUnit": "bag",
     "gst": "5",
     "taxIncl": "",
     "mrp": "45",
     "hsn": "1904",
     "category": "atta",
     "hint": {
      "bigUnit": [
       "bag"
      ]
     }
    },
    {
     "name": "Glucose bisc. 100 gm",
     "baseUnit": "packet",
     "bigUnit": "carton",
     "perBig": "120",
     "rate": "480",
     "rateUnit": "carton",
     "gst": "5",
     "taxIncl": "",
     "mrp": "5",
     "hsn": "1905",
     "category": "biscuits"
    },
    {
     "name": "Coconut oil 500 ml",
     "baseUnit": "bottle",
     "bigUnit": "box",
     "perBig": "24",
     "rate": "",
     "rateUnit": "",
     "gst": "5",
     "taxIncl": "",
     "mrp": "120",
     "hsn": "1513",
     "category": "oil"
    }
   ]
  },
  "zoho": {
   "org": "Ramesh Traders",
   "rows": [
    {
     "name": "Parle-G Gold 100g",
     "baseUnit": "packet",
     "bigUnit": "carton",
     "perBig": "96",
     "rate": "720",
     "rateUnit": "carton",
     "gst": "5",
     "taxIncl": "extra",
     "mrp": "10",
     "hsn": "1905",
     "category": "biscuits"
    },
    {
     "name": "Good Day Cashew 75g",
     "baseUnit": "packet",
     "bigUnit": "carton",
     "perBig": "72",
     "rate": "1050",
     "rateUnit": "carton",
     "gst": "5",
     "taxIncl": "extra",
     "mrp": "20",
     "hsn": "1905",
     "category": "biscuits"
    },
    {
     "name": "Aashirvaad Atta 5 kg",
     "baseUnit": "bag",
     "bigUnit": "bale",
     "perBig": "4",
     "rate": "1020",
     "rateUnit": "bale",
     "gst": "5",
     "taxIncl": "extra",
     "mrp": "290",
     "hsn": "1101",
     "category": "atta"
    },
    {
     "name": "Fortune Sunflower Oil 1 L",
     "baseUnit": "pouch",
     "bigUnit": "peti",
     "perBig": "12",
     "rate": "1850",
     "rateUnit": "peti",
     "gst": "5",
     "taxIncl": "extra",
     "mrp": "170",
     "hsn": "1512",
     "category": "oil"
    },
    {
     "name": "Tata Salt 1 kg",
     "baseUnit": "packet",
     "bigUnit": "bag",
     "perBig": "25",
     "rate": "560",
     "rateUnit": "bag",
     "gst": "0",
     "taxIncl": "extra",
     "mrp": "28",
     "hsn": "2501",
     "category": "salt-sugar"
    },
    {
     "name": "Maggi Masala 70g",
     "baseUnit": "packet",
     "bigUnit": "carton",
     "perBig": "96",
     "rate": "1060",
     "rateUnit": "carton",
     "gst": "5",
     "taxIncl": "extra",
     "mrp": "15",
     "hsn": "1902",
     "category": "noodles"
    },
    {
     "name": "Red Label Tea 250g",
     "baseUnit": "packet",
     "bigUnit": "carton",
     "perBig": "40",
     "rate": "4560",
     "rateUnit": "carton",
     "gst": "5",
     "taxIncl": "extra",
     "mrp": "150",
     "hsn": "0902",
     "category": "tea"
    },
    {
     "name": "Everest Garam Masala 100g",
     "baseUnit": "packet",
     "bigUnit": "box",
     "perBig": "20",
     "rate": "1240",
     "rateUnit": "box",
     "gst": "5",
     "taxIncl": "extra",
     "mrp": "80",
     "hsn": "0910",
     "category": "spices"
    },
    {
     "name": "Haldiram Bhujia 200g",
     "baseUnit": "packet",
     "bigUnit": "carton",
     "perBig": "40",
     "rate": "1960",
     "rateUnit": "carton",
     "gst": "5",
     "taxIncl": "extra",
     "mrp": "60",
     "hsn": "2106",
     "category": "snacks"
    },
    {
     "name": "Frooti 600 ml",
     "baseUnit": "bottle",
     "bigUnit": "crate",
     "perBig": "24",
     "rate": "700",
     "rateUnit": "crate",
     "gst": "5",
     "taxIncl": "extra",
     "mrp": "35",
     "hsn": "2202",
     "category": "drinks"
    },
    {
     "name": "Amul Ghee 1 L",
     "baseUnit": "pouch",
     "bigUnit": "carton",
     "perBig": "12",
     "rate": "7200",
     "rateUnit": "carton",
     "gst": "5",
     "taxIncl": "extra",
     "mrp": "650",
     "hsn": "0405",
     "category": "oil"
    },
    {
     "name": "Toor dal 1 kg",
     "baseUnit": "packet",
     "bigUnit": "bag",
     "perBig": "30",
     "rate": "3600",
     "rateUnit": "bag",
     "gst": "5",
     "taxIncl": "extra",
     "mrp": "160",
     "hsn": "0713",
     "category": "dal"
    }
   ]
  },
  "customersFile": {
   "label": "Customers.xlsx",
   "rows": [
    {
     "name": "Sharma Kirana Store",
     "phone": "98220 41237",
     "email": "sharma.kirana@gmail.com",
     "address": "Shivaji Nagar, Pune"
    },
    {
     "name": "Gupta Stores",
     "phone": "97300 55821",
     "email": "",
     "address": "Shivaji Nagar, Pune"
    },
    {
     "name": "Mahalaxmi Provision",
     "phone": "90110 2234",
     "email": "",
     "address": "Deccan, Pune"
    },
    {
     "name": "Patil General Stores",
     "phone": "88050 77123",
     "email": "patil@store",
     "address": "Warje, Pune"
    },
    {
     "name": "",
     "phone": "93250 66110",
     "email": "",
     "address": "Kothrud, Pune"
    },
    {
     "name": "New Bharat Traders",
     "phone": "70200 33410",
     "email": "newbharat@gmail.com",
     "address": ""
    },
    {
     "name": "Shree Sai Kirana",
     "phone": "",
     "email": "",
     "address": "Kothrud, Pune"
    },
    {
     "name": "Om Provision Stores",
     "phone": "98500 12890",
     "email": "",
     "address": "Aundh, Pune"
    },
    {
     "name": "Sharma Kirana",
     "phone": "98220 41237",
     "email": "",
     "address": "Shivaji Nagar, Pune"
    },
    {
     "name": "Laxmi Traders",
     "phone": "+91 99230 45678",
     "email": "laxmi.traders@gmail.com",
     "address": "Baner, Pune"
    }
   ]
  }
 },
 "voiceExample": "Parle-G 100 gram carton of 96 packets 720 rupees per carton, Tata salt 1 kg bag of 25 packets 560 rupees, Fortune sunflower oil 1 litre peti of 12 bottles 1850 rupees, Maggi 70 gram carton 1060",
 "categories": [
  {
   "id": "biscuits",
   "name": "Biscuits & rusk",
   "icon": "🍪"
  },
  {
   "id": "atta",
   "name": "Atta & rice",
   "icon": "🌾"
  },
  {
   "id": "oil",
   "name": "Oil & ghee",
   "icon": "🫙"
  },
  {
   "id": "dal",
   "name": "Dal & pulses",
   "icon": "🫘"
  },
  {
   "id": "spices",
   "name": "Masala & spices",
   "icon": "🌶️"
  },
  {
   "id": "tea",
   "name": "Tea & coffee",
   "icon": "☕"
  },
  {
   "id": "noodles",
   "name": "Noodles & pasta",
   "icon": "🍜"
  },
  {
   "id": "snacks",
   "name": "Namkeen & snacks",
   "icon": "🥨"
  },
  {
   "id": "salt-sugar",
   "name": "Salt & sugar",
   "icon": "🧂"
  },
  {
   "id": "drinks",
   "name": "Drinks & juices",
   "icon": "🧃"
  }
 ],
 "catalog": [
  {
   "name": "Parle-G Gold 100g",
   "baseUnit": "packet",
   "bigUnit": "carton",
   "perBig": "96",
   "mrp": "10",
   "gst": "5",
   "hsn": "1905",
   "category": "biscuits"
  },
  {
   "name": "Britannia Marie Gold 250g",
   "baseUnit": "packet",
   "bigUnit": "carton",
   "perBig": "36",
   "mrp": "40",
   "gst": "5",
   "hsn": "1905",
   "category": "biscuits"
  },
  {
   "name": "Good Day Cashew 75g",
   "baseUnit": "packet",
   "bigUnit": "carton",
   "perBig": "72",
   "mrp": "20",
   "gst": "5",
   "hsn": "1905",
   "category": "biscuits"
  },
  {
   "name": "Bourbon 120g",
   "baseUnit": "packet",
   "bigUnit": "carton",
   "perBig": "60",
   "mrp": "30",
   "gst": "5",
   "hsn": "1905",
   "category": "biscuits"
  },
  {
   "name": "Milk rusk 300g",
   "baseUnit": "packet",
   "bigUnit": "carton",
   "perBig": "30",
   "mrp": "55",
   "gst": "5",
   "hsn": "1905",
   "category": "biscuits"
  },
  {
   "name": "Aashirvaad Atta 5 kg",
   "baseUnit": "packet",
   "bigUnit": "bag",
   "perBig": "4",
   "mrp": "290",
   "gst": "5",
   "hsn": "1101",
   "category": "atta"
  },
  {
   "name": "Fortune Chakki Atta 10 kg",
   "baseUnit": "kg",
   "bigUnit": "bag",
   "perBig": "10",
   "mrp": "520",
   "gst": "5",
   "hsn": "1101",
   "category": "atta"
  },
  {
   "name": "India Gate Basmati 1 kg",
   "baseUnit": "packet",
   "bigUnit": "bag",
   "perBig": "20",
   "mrp": "190",
   "gst": "5",
   "hsn": "1006",
   "category": "atta"
  },
  {
   "name": "Sona Masoori rice 25 kg",
   "baseUnit": "kg",
   "bigUnit": "bag",
   "perBig": "25",
   "mrp": "1450",
   "gst": "5",
   "hsn": "1006",
   "category": "atta"
  },
  {
   "name": "Fortune Sunflower Oil 1 L",
   "baseUnit": "bottle",
   "bigUnit": "peti",
   "perBig": "12",
   "mrp": "170",
   "gst": "5",
   "hsn": "1512",
   "category": "oil"
  },
  {
   "name": "Saffola Gold 1 L",
   "baseUnit": "bottle",
   "bigUnit": "peti",
   "perBig": "12",
   "mrp": "210",
   "gst": "5",
   "hsn": "1517",
   "category": "oil"
  },
  {
   "name": "Amul Ghee 1 L",
   "baseUnit": "pouch",
   "bigUnit": "carton",
   "perBig": "12",
   "mrp": "650",
   "gst": "5",
   "hsn": "0405",
   "category": "oil"
  },
  {
   "name": "Mustard oil 1 L",
   "baseUnit": "bottle",
   "bigUnit": "peti",
   "perBig": "12",
   "mrp": "180",
   "gst": "5",
   "hsn": "1514",
   "category": "oil"
  },
  {
   "name": "Toor dal 1 kg",
   "baseUnit": "packet",
   "bigUnit": "bag",
   "perBig": "30",
   "mrp": "160",
   "gst": "5",
   "hsn": "0713",
   "category": "dal"
  },
  {
   "name": "Moong dal 1 kg",
   "baseUnit": "packet",
   "bigUnit": "bag",
   "perBig": "30",
   "mrp": "140",
   "gst": "5",
   "hsn": "0713",
   "category": "dal"
  },
  {
   "name": "Chana dal 1 kg",
   "baseUnit": "packet",
   "bigUnit": "bag",
   "perBig": "30",
   "mrp": "95",
   "gst": "5",
   "hsn": "0713",
   "category": "dal"
  },
  {
   "name": "Masoor dal 1 kg",
   "baseUnit": "packet",
   "bigUnit": "bag",
   "perBig": "30",
   "mrp": "110",
   "gst": "5",
   "hsn": "0713",
   "category": "dal"
  },
  {
   "name": "Everest Garam Masala 100g",
   "baseUnit": "packet",
   "bigUnit": "box",
   "perBig": "20",
   "mrp": "80",
   "gst": "5",
   "hsn": "0910",
   "category": "spices"
  },
  {
   "name": "MDH Chana Masala 100g",
   "baseUnit": "packet",
   "bigUnit": "box",
   "perBig": "20",
   "mrp": "85",
   "gst": "5",
   "hsn": "0910",
   "category": "spices"
  },
  {
   "name": "Turmeric powder 200g",
   "baseUnit": "packet",
   "bigUnit": "box",
   "perBig": "25",
   "mrp": "60",
   "gst": "5",
   "hsn": "0910",
   "category": "spices"
  },
  {
   "name": "Red chilli powder 200g",
   "baseUnit": "packet",
   "bigUnit": "box",
   "perBig": "25",
   "mrp": "90",
   "gst": "5",
   "hsn": "0904",
   "category": "spices"
  },
  {
   "name": "Red Label Tea 250g",
   "baseUnit": "packet",
   "bigUnit": "carton",
   "perBig": "40",
   "mrp": "150",
   "gst": "5",
   "hsn": "0902",
   "category": "tea"
  },
  {
   "name": "Tata Tea Gold 500g",
   "baseUnit": "packet",
   "bigUnit": "carton",
   "perBig": "24",
   "mrp": "310",
   "gst": "5",
   "hsn": "0902",
   "category": "tea"
  },
  {
   "name": "Nescafe Classic 50g",
   "baseUnit": "packet",
   "bigUnit": "carton",
   "perBig": "48",
   "mrp": "190",
   "gst": "5",
   "hsn": "2101",
   "category": "tea"
  },
  {
   "name": "Bru Instant 100g",
   "baseUnit": "packet",
   "bigUnit": "carton",
   "perBig": "48",
   "mrp": "220",
   "gst": "5",
   "hsn": "2101",
   "category": "tea"
  },
  {
   "name": "Maggi Masala 70g",
   "baseUnit": "packet",
   "bigUnit": "carton",
   "perBig": "96",
   "mrp": "15",
   "gst": "5",
   "hsn": "1902",
   "category": "noodles"
  },
  {
   "name": "Yippee Noodles 70g",
   "baseUnit": "packet",
   "bigUnit": "carton",
   "perBig": "96",
   "mrp": "15",
   "gst": "5",
   "hsn": "1902",
   "category": "noodles"
  },
  {
   "name": "Macaroni 500g",
   "baseUnit": "packet",
   "bigUnit": "carton",
   "perBig": "24",
   "mrp": "85",
   "gst": "5",
   "hsn": "1902",
   "category": "noodles"
  },
  {
   "name": "Haldiram Bhujia 200g",
   "baseUnit": "packet",
   "bigUnit": "carton",
   "perBig": "40",
   "mrp": "60",
   "gst": "5",
   "hsn": "2106",
   "category": "snacks"
  },
  {
   "name": "Lay's Classic 52g",
   "baseUnit": "packet",
   "bigUnit": "carton",
   "perBig": "48",
   "mrp": "20",
   "gst": "5",
   "hsn": "2005",
   "category": "snacks"
  },
  {
   "name": "Kurkure Masala Munch 90g",
   "baseUnit": "packet",
   "bigUnit": "carton",
   "perBig": "48",
   "mrp": "20",
   "gst": "5",
   "hsn": "2106",
   "category": "snacks"
  },
  {
   "name": "Tata Salt 1 kg",
   "baseUnit": "packet",
   "bigUnit": "bag",
   "perBig": "25",
   "mrp": "28",
   "gst": "0",
   "hsn": "2501",
   "category": "salt-sugar"
  },
  {
   "name": "Sugar 1 kg",
   "baseUnit": "packet",
   "bigUnit": "bag",
   "perBig": "30",
   "mrp": "48",
   "gst": "5",
   "hsn": "1701",
   "category": "salt-sugar"
  },
  {
   "name": "Jaggery 1 kg",
   "baseUnit": "packet",
   "bigUnit": "bag",
   "perBig": "20",
   "mrp": "70",
   "gst": "0",
   "hsn": "1701",
   "category": "salt-sugar"
  },
  {
   "name": "Frooti 600 ml",
   "baseUnit": "bottle",
   "bigUnit": "crate",
   "perBig": "24",
   "mrp": "35",
   "gst": "5",
   "hsn": "2202",
   "category": "drinks"
  },
  {
   "name": "Real Mixed Fruit 1 L",
   "baseUnit": "bottle",
   "bigUnit": "carton",
   "perBig": "12",
   "mrp": "120",
   "gst": "5",
   "hsn": "2202",
   "category": "drinks"
  },
  {
   "name": "Thums Up 750 ml",
   "baseUnit": "bottle",
   "bigUnit": "crate",
   "perBig": "24",
   "mrp": "40",
   "gst": "40",
   "hsn": "2202",
   "category": "drinks"
  },
  {
   "name": "Bisleri 1 L",
   "baseUnit": "bottle",
   "bigUnit": "crate",
   "perBig": "12",
   "mrp": "20",
   "gst": "18",
   "hsn": "2201",
   "category": "drinks"
  }
 ],
 "contacts": [
  {
   "id": "c01",
   "name": "Sharma Kirana Store",
   "phone": "98220 •••••",
   "area": "Shivaji Nagar",
   "kind": "shop"
  },
  {
   "id": "c02",
   "name": "Gupta Stores",
   "phone": "97300 •••••",
   "area": "Shivaji Nagar",
   "kind": "shop"
  },
  {
   "id": "c03",
   "name": "Mahalaxmi Provision",
   "phone": "90110 •••••",
   "area": "Deccan",
   "kind": "shop"
  },
  {
   "id": "c04",
   "name": "Patil General Stores",
   "phone": "88050 •••••",
   "area": "Warje",
   "kind": "shop"
  },
  {
   "id": "c05",
   "name": "New Bharat Traders",
   "phone": "93250 •••••",
   "area": "Kothrud",
   "kind": "shop"
  },
  {
   "id": "c06",
   "name": "Shree Sai Kirana",
   "phone": "70200 •••••",
   "area": "Kothrud",
   "kind": "shop"
  },
  {
   "id": "c07",
   "name": "Om Provision Stores",
   "phone": "98500 •••••",
   "area": "Aundh",
   "kind": "shop"
  },
  {
   "id": "c08",
   "name": "Balaji General Store",
   "phone": "77090 •••••",
   "area": "Baner",
   "kind": "shop"
  },
  {
   "id": "c09",
   "name": "Sai Traders",
   "phone": "98900 •••••",
   "area": "Market Yard",
   "kind": "supplier"
  },
  {
   "id": "c10",
   "name": "Raju (driver)",
   "phone": "97300 ••118",
   "area": "",
   "kind": "driver"
  },
  {
   "id": "c11",
   "name": "Sunita",
   "phone": "99220 •••••",
   "area": "",
   "kind": "person"
  },
  {
   "id": "c12",
   "name": "Amit Bhai",
   "phone": "98600 •••••",
   "area": "",
   "kind": "person"
  }
 ],
 "readMillis": 6000
};
