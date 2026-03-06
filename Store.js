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
			
			//intentional fall through 
			switch (true) {
				case targetDay > 5:
					selectStore();
				case targetDay > 2:
					selectStore();
				default:
					selectStore();
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
			const storeHeader = document.createElement('div');
			storeHeader.textContent = `Store: ${store.StoreName} (Day ${store.StoreDay})`;
			storeHeader.style.fontWeight = 'bold';
			container.appendChild(storeHeader);
			
			const { data: stockItems, error } = await supabaseClient
			.from("Stock")
			.select("StockId, StockItems, StoreId, StockWeight, ItemId, Day, Items(ItemValue, ItemId, ItemName, ItemDescription, Modifiers)")
			.eq("StoreId", store.StoreId)
			.lte("Day", targetDay);
	
		if (error) {
			const errMsg = document.createElement('div');
			errMsg.textContent = `Error fetchign stock for ${store.StoreName}`;
			container.appendChild(errMsg);
			continue;
		}
		
		if (!stockItems || stockItems.length === 0) {
			const noStock = document.createElement('div');
			noStock.textContent = " No stock available.";
			container.appendChild(noStock);
			continue;
		}
		
		for (const item of stockItems) {
			const rarity = getRarity(item.Items.ItemValue);
			
			const btn = document.createElement('button');
			btn.textContent = `${item.StockItems} || ${rarity}`;
			btn.addEventListener('click', () => {
				extraDetails.classList.add("show");
				hiddenSection.classList.add("show");
				itemDetail(item, rarity, extraDetails);
	});
	
	container.appendChild(btn);

		}
	}
}

	
	function selectStore () {
		const use = shuffledStores.shift();
		
		storeTable.push(use);
		
	}
		
	function itemDetail (item, rarity, extraDetails) {
		
		let itemDetails = `-${item.StockItems}<br>${rarity}<br>--------------------<br><br>${item.Items.Modifiers || "None"}`;
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
