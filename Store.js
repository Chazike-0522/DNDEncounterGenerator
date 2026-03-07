import {Shuffle} from "./Shuffle.js";
import { supabaseClient } from './SupabaseClient.js';

document.addEventListener("DOMContentLoaded", () => {
	const purchaseBtn = document.getElementById("purchase");
	const targetDayInput = document.getElementById("Day");
	const container = document.getElementById('flexContainer');
	
	
	
	purchaseBtn.addEventListener("click", async () => {
		container.classList.add("show");
		
		const targetDay = parseInt(targetDayInput.value) || 1;
		let storeTable =[];
		let stockTable = [];
		let shuffledStores = []; 
		let htmlOutput = "";
		  
		try {
			
			const {data: Stores, error} = await supabaseClient
			.from ("Stores")
			.select ("StoreId, StoreName, StoreDay")
			.lte ("StoreDay", targetDay);
			
			shuffledStores = Shuffle(Stores);
			
			
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
			console.log("Raw response:", Stores, error);
			printStoresStock(targetDay);
			
		} 
	 catch (err) {
		console.error(err);
	}
					
	async function printStoresStock(targetDay) {
		container.innerHTML ="";
		const extraDetails = document.getElementById('hiddenData');
		const hiddenSection = document.getElementById('leftColumn');
		
		for (const store of storeTable) {
			const storeColumn = document.createElement('div');
			storeColumn.classList.add('storeColumn');
			
			storeColumn.id = `storeColumn-${store.StoreId}`;
			container.appendChild(storeColumn);
			
			const storeHeader = document.createElement('div');
			storeHeader.classList.add("storeHeader");
			storeHeader.textContent = `${store.StoreName}`;
			storeHeader.style.fontWeight = 'bold';
			
			const rareItems = document.createElement('div');
			rareItems.classList.add('rareItems');
			
			const normalItems = document.createElement('div');
			normalItems.classList.add('normalItems');
			
			storeColumn.appendChild(storeHeader);
			storeColumn.appendChild(rareItems);
			storeColumn.appendChild(normalItems);
			
			const { data: stockItems, error } = await supabaseClient
			.from("Stock")
			.select("StockId, StockItems, StoreId, StockWeight, ItemId, Day, Items!Stock_ItemId_fkey(ItemValue, ItemId, ItemName, ItemDescription, Modifiers)")
			.eq("StoreId", store.StoreId)
			.lte("Day", targetDay)
	
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
		
		stockItems.sort((a, b) => (b.Items?.ItemValue || 0) - (a.Items?.ItemValue || 0));
	
		for (const item of stockItems) {
			const itemData = item.Items || { ItemValue: 0, Modifiers: "None" };
			const rarity = getRarity(itemData.ItemValue);
			
			document.getElementById("closeDetails").addEventListener("click", clearActive);
			
			if (Math.random() > item.StockWeight) continue;
			
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
			
			btn.addEventListener('click', () => {
				if (btn.classList.contains('active')){
					clearActive();
					return;
				}
				
				clearActive();
				btn.classList.add('active');
				extraDetails.classList.add("show");
				hiddenSection.classList.add("show");
				
				itemDetail(item, rarity, extraDetails);
					});
	
	if (item.StockWeight < 1) {
		rareItems.appendChild(btn);
	} else {
		normalItems.appendChild(btn);
	}
		}
	
		if (rareItems.children.length > 0) {			
			const rareHeader = document.createElement('div');
			rareHeader.textContent = "Rare Stock";
			rareHeader.classList.add('rareHeader');
			rareItems.prepend(rareHeader);
		}
	}
	
		
	function clearActive() {
		document.querySelectorAll('.storeOptions').forEach(b => b.classList.remove('active'));
		extraDetails.classList.remove("show");
		hiddenSection.classList.remove("show");
		extraDetails.innerHTML = "";
	}
}

	
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
		
	function itemDetail (item, rarity, extraDetails) {
		
		let itemDetails = `${item.StockItems}<br>${rarity}<br>--------------------<br><br>${item.Items?.Modifiers || "None"}`;
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
	
