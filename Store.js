import {Shuffle} from "./Shuffle.js";
import { supabaseClient } from './supabaseClient.js';

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
		for (const store of storeTable) {
			htmlOutput += `Store: ${store.StoreName} (Day ${store.StoreDay})<br>`;
			
			const { data: stockItems, error } = await supabaseClient
			.from("Stock")
			.select("StockId, StockItems, StoreId, StockWeight, ItemId, Day, Items(ItemValue, ItemId, ItemName, ItemDescription, Modifiers)")
			.eq("StoreId", store.StoreId)
			.lte("Day", targetDay);
	
		if (error) {
			htmlOutput = `Error fetching stock for ${store.StoreName}<br>`;
			return;
		}
		
		if (!stockItems || stockItems.length === 0) {
			htmlOutput = " No stock available.";
			return;
		}
		for (const item of stockItems) {
			let rarity;
			switch (item.Items.ItemValue) {
				case 12:
					rarity = 'Legendary';
					break;
				case 8:
					rarity = 'Very Rare';
					break;
				case 4:
					rarity = 'Rare';
					break;
				case 2:
					rarity = 'Uncommon';
					break;
				default:
					rarity = 'Common';
			}	
			htmlOutput += ` -${item.StockItems} || ${rarity}) || ${item.Items.Modifiers}<br>`;				
		}
		container.innerHTML = htmlOutput;
	}
}
	
	function selectStore () {
		const use = shuffledStores.shift();
		
		storeTable.push(use);
		
	}
		
			
	});
});
