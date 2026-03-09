import {Shuffle} from "./Shuffle.js";
import { supabaseClient } from './SupabaseClient.js';

document.addEventListener("DOMContentLoaded", () => {
	const purchaseBtn = document.getElementById("purchase");
	const targetDayInput = document.getElementById("Day");
	const container = document.getElementById('flexContainer');
	
	
	//primary function of store
	purchaseBtn.addEventListener("click", async () => {
		container.classList.add("show");
		
		const targetDay = parseInt(targetDayInput.value) || 1;
		let storeTable =[];
		let stockTable = [];
		let shuffledStores = []; 
		let htmlOutput = "";
		  
		try {
			//query store table
			const {data: Stores, error} = await supabaseClient
			.from ("Stores")
			.select ("StoreId, StoreName, StoreDay")
			.lte ("StoreDay", targetDay);
			//store a shuffeled array of possible stores.
			shuffledStores = Shuffle(Stores);
			
			//determines what store to use. empty fields are random. 1 = forgemaster, 2=alch, 3= enchanter, 4=whisperer,5=lannista 
			switch (true) {
				case targetDay == 5:
					selectStore();
					selectStore(5);
					selectStore(4);
					break;
				case targetDay == 4:
					selectStore();
					selectStore();
					selectStore(4);
					break;
				case targetDay == 3:
					selectStore();
					selectStore(4);
					selectStore(1);
					break;
				case targetDay == 2:
					selectStore();
					selectStore(3);
					selectStore(1);
					break;
				case targetDay == 1:
					selectStore(1);
					break;
				default:
					selectStore();
					selectStore();
					selectStore(4);
			}
			//prints response data for troubleshooting
			console.log("Raw response:", Stores, error);
			printStoresStock(targetDay);
			
		} 
	 catch (err) {
		console.error(err);
	}
	//function determining what and how much enters the store				
	async function printStoresStock(targetDay) {
		container.innerHTML ="";
		const extraDetails = document.getElementById('hiddenData');
		const hiddenSection = document.getElementById('leftColumn');
		//checks rolled store table and iterates through each one.
		for (const store of storeTable) {
			const storeColumn = document.createElement('div');
			storeColumn.classList.add('storeColumn');
			//dynamically creates columns for each store in the array 
			storeColumn.id = `storeColumn-${store.StoreId}`;
			container.appendChild(storeColumn);
			//attaches store name to the top of each column
			const storeHeader = document.createElement('div');
			storeHeader.classList.add("storeHeader");
			storeHeader.textContent = `${store.StoreName}`;
			storeHeader.style.fontWeight = 'bold';
			//creates a rare items list for things with less than a 100% chance of spawning
			const rareItems = document.createElement('div');
			rareItems.classList.add('rareItems');
			//creates a column that will store all certain spawn items.
			const normalItems = document.createElement('div');
			normalItems.classList.add('normalItems');
			//organized column builders in order.
			storeColumn.appendChild(storeHeader);
			storeColumn.appendChild(rareItems);
			storeColumn.appendChild(normalItems);
			//join (outer?right?) join to query the stock and item tables based off of each stores storeID.
			const { data: stockItems, error } = await supabaseClient
			.from("Stock")
			.select("StockId, StockItems, StoreId, StockWeight, ItemId, Day, Items!Stock_ItemId_fkey(ItemValue, ItemId, ItemName, ItemDescription, Modifiers, ItemCost)")
			.eq("StoreId", store.StoreId)
			.lte("Day", targetDay)
		//logs data returned from query for troubleshooting
		console.log("Stock raw:", stockItems, "Error: ", error);
		
		if (error) {
			const errMsg = document.createElement('div');
			errMsg.textContent = `Error fetchign stock for ${store.StoreName}`;
			storeColumn.appendChild(errMsg);
			continue;
		}
		
		if (!stockItems || stockItems.length === 0) {
			const noStock = document.createElement('div');
			noStock.textContent = " No stock available.";
			storeColumn.appendChild(noStock);
			continue;
		}
		//organizes stock by rarity
		stockItems.sort((a, b) => (b.Items?.ItemValue || 0) - (a.Items?.ItemValue || 0));
		
		//looks through object for each item on the list that the store holds
		for (const item of stockItems) {
			const itemData = item.Items || { ItemValue: 0, Modifiers: "None" };
			const rarity = getRarity(itemData.ItemValue);
			//close by reselecting
			document.getElementById("closeDetails").addEventListener("click", clearActive);
			
			//rolls a random percent chance to determine if an item should be used.
			if (Math.random() > item.StockWeight) continue;
				//assigns classes based on rarity value. classes are stylized in css to have each rarity have a differing button design.
			const btn = document.createElement('button');
			btn.textContent = item.StockItems;
			switch (rarity) {
				case 'Legendary':
					btn.classList.add("gold");
					break;
				case 'Very Rare': 
					btn.classList.add("purple");
					break;
				case 'Rare':
					btn.classList.add("blue");
					break;
				case 'Uncommon':
					btn.classList.add("green");
					break;
				default:
					btn.classList.add("grey");
			}
			btn.classList.add("storeOptions");
			//code for each store button. currently adds active class, and removes all other actives. then sends description texts to the left column
			btn.addEventListener('click', () => {
				if (btn.classList.contains('active')){
					clearActive();
					return;
				}
				//as listed above but additionally makes left column "visible" through a css class change.
				clearActive();
				btn.classList.add('active');
				extraDetails.classList.add("show");
				hiddenSection.classList.add("show");
				
				itemDetail(item, rarity, extraDetails);
					});
	//checks if an item should be rare or normal columned.
	if (item.StockWeight < 1) {
		rareItems.appendChild(btn);
	} else {
		normalItems.appendChild(btn);
	}
		}
		
		//creates a rare section if anything spawned.
		if (rareItems.children.length > 0) {			
			const rareHeader = document.createElement('div');
			rareHeader.textContent = "Rare Stock";
			rareHeader.classList.add('rareHeader');
			rareItems.prepend(rareHeader);
		}
	}
	
			//clears all active buttons to remove left column from view.
	function clearActive() {
		document.querySelectorAll('.storeOptions').forEach(b => b.classList.remove('active'));
		extraDetails.classList.remove("show");
		hiddenSection.classList.remove("show");
		extraDetails.innerHTML = "";
	}
}

	//rolls for a random store or accepts an input for a specific store. currently only possible from the code side. includes console.log for debugging
	function selectStore (forceStore = null) {
		let use; 
		console.log("force store = ", forceStore);
		if(forceStore !== null) {
			const index = shuffledStores.findIndex(s => s.StoreId === forceStore);
			if (index!== -1) {
				use = shuffledStores.splice(index, 1)[0];
			}
		}
		
		if (!use) {
			use = shuffledStores.shift();
		}
		
		console.log("Selecting store:", use ?  use : "nothing");
		
		if (use) storeTable.push(use);
		storeTable.sort((a, b) => a.StoreId - b.StoreId);
		
		console.log(storeTable);
	}
		//formats and returns each items description for use in the leftside column.
	function itemDetail (item, rarity, extraDetails) {
		
		let itemDetails = `${item.StockItems}<br>${rarity} || Cost: ${item.Items.ItemCost} Tokens <br>--------------------<br><br>${item.Items?.Modifiers || "None"}`;
		extraDetails.innerHTML = itemDetails;
		
	}	

	function getRarity (value) {
		switch(value){
			case 12: return 'Legendary';
			case 8: return 'Very Rare';
			case 4: return 'Rare';
			case 2: return 'Uncommon';
			default: return 'Common';
		}
	}

	
	});	
});	
	
