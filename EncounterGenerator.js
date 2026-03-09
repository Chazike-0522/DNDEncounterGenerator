import {Shuffle} from "./Shuffle.js";
import { supabaseClient } from './SupabaseClient.js';

document.addEventListener("DOMContentLoaded", () => {
	const generateBtn = document.getElementById("generate");
	const targetCRInput = document.getElementById("CR");
	const container = document.getElementById('gridContainer');
	
	
		//create button for generating fights
	generateBtn.addEventListener("click", async () => {
		container.classList.add("show");
		
		//recieve user input or default 5;
		const targetCR = parseInt(targetCRInput.value) || 5;
		let EnemyTable = [];
		let Terrain = [];
		let TerrainLoot = [];
		let allTerrain;
		let terrainData = null; 
		
		try {
			let enemyData;
			//call terrain table data
			const response = await supabaseClient
			.from("Terrain")
			.select("TerrainId, Terrain");
			allTerrain = response.data;
			
			//as long asthe array is bigger than 0, randomly select a terrain from the array, and push it to terrainData
			//works by multiplying terrain length by random number 0 to .999 and rounding down to the nearest integer
			if (allTerrain && allTerrain.length > 0) {
				terrainData = allTerrain[Math.floor(Math.random() * allTerrain.length)];
				Terrain.push(terrainData);
			}
			
			//call terrain specific data: enemies, loot , ect.
			if (terrainData) {
				const { data: terrainEnemies, error: enemyError} = await supabaseClient
				.from("EnemyTable")
				.select("EnemyId, TerrainId, EnemyName, CR, EnemyLootId")
				.eq("TerrainId", terrainData.TerrainId);
				
				
				if (enemyError) throw enemyError;
				// asign temporary objects to array variables created earlier. create a smaller array of 5 monsters for concentrated events
				EnemyTable = terrainEnemies || [];
				EnemyTable = Shuffle(EnemyTable).slice(0, 5);
			}
		}
	 catch (err) {
		console.error(err);
	}
		
		
		let totalCR = 0;
		let encounter = [];
		let attempts = 0;
		//this adds enemies from the array one at a time until targetCR or targetCR +1 is reached.it caps at 100 times in case  a full challenge cannot be made
		while (totalCR < targetCR && EnemyTable.length > 0 && attempts < 100) {
			attempts++;
			const idx = Math.floor(Math.random() * EnemyTable.length);
			const enemy = EnemyTable[idx];
			if (totalCR + enemy.CR <= targetCR + 1) {
			encounter.push(enemy);
			totalCR += enemy.CR;
			}
		}
		//organize monster array alphabetically
		encounter.sort((a, b) => {
			if (a.CR !== b.CR) return a.CR - b.CR;
			return a.EnemyName.localeCompare(b.EnemyName);
		});
		
		container.innerHTML = "";
		//creates a header for the grid/declare variables.
		const header = document.createElement('div');
		header.classList.add('gridItem');
		header.style.gridColumn = "1/-1";
		header.innerHTML = `Encounter (Target CR: ${targetCR}):<br>Location: ${Terrain[0].Terrain}`;
		container.appendChild(header);
		//query enemy loot table
		for (const m of encounter){
			const {data: EnemyLoot} = await supabaseClient
				.from("EnemyLoot")
				.select("EnemyLootId, LootName, LootWeight")
				.eq("EnemyLootId", m.EnemyLootId);
			//determine what and how much gets spawned
			let lootNames=[];
			if (EnemyLoot && EnemyLoot.length > 0) {
				const numLoot = Math.max(1, Math.ceil(m.CR /3));
				for (let i = 0; i < numLoot; i++) {
					const totalWeight = EnemyLoot.reduce((sum, item) => sum + (item.LootWeight || 0), 0);
					let random = Math.random() * totalWeight;
					
					for (const item of EnemyLoot) {
					if (random < (item.LootWeight || 0)) {
						lootNames.push(item.LootName);
						break;
					}
					random -= item.LootWeight;
					}
				}
			}
			//populate grid item for each associated monster
			const pop = document.createElement('div');
			pop.classList.add('gridItem');
			pop.innerHTML = `<strong>${m.EnemyName}</strong> (CR ${m.CR})<br>${lootNames.join("<br>")}`;
			container.appendChild(pop);
		}
	
	/*if (Terrain.length > 0) {
		const { data: allTerrainLoot } = await supabaseClient
		.from("TerrainLoot")
		.select("TerrainId, TerrainLoot, TLootWeight")
		.eq("TerrainId", Terrain[0].TerrainId);
		
		let terrainLootNames = [];
			
	if (allTerrainLoot && allTerrainLoot.length > 0) {
		TerrainLoot = allTerrainLoot;
		const numTerrainLoot = Math.max(1, Math.floor(targetCR/2));
		
		for (let i = 0; i < numTerrainLoot; i++) {
		const terrainLootWeight = TerrainLoot.reduce((sum, item) => sum + (item.TLootWeight || 0), 0);
		let random = Math.random() * terrainLootWeight;
		
		for (const item of TerrainLoot) {
			if (random < (item.TLootWeight || 0)) {
				terrainLootNames.push(item.TerrainLoot);
				break;
			}
			random -= item.TLootWeight;
		}
		}
		}		
		outputText += `Terrain Loot:<br> ${terrainLootNames.join("<br>")}<br><br>`;
	}
		popup.innerHTML = outputText;
		
	});*/
			
});
});