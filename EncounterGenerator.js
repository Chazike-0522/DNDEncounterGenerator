import {Shuffle} from "./Shuffle.js";

document.addEventListener("DOMContentLoaded", () => {
	const generateBtn = document.getElementById("generate");
	const targetCRInput = document.getElementById("CR");
	const container = document.getElementById('gridContainer');
	
	const SUPABASE_URL = "https://wgwvwcegagtmgxvybdok.supabase.co";
	const SUPABASE_KEY = "sb_publishable_EqSdBnhzoZ1UDXfKnd6Yvw_v1nko1qS";
	const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
		
	generateBtn.addEventListener("click", async () => {
		container.classList.add("show");
		
		const targetCR = parseInt(targetCRInput.value) || 5;
		let EnemyTable = [];
		let Terrain = [];
		let TerrainLoot = [];
		let allTerrain;
		let terrainData = null; 
		
		try {
			let enemyData;
			
			const response = await supabaseClient
			.from("Terrain")
			.select("TerrainId, Terrain");
			allTerrain = response.data;
			
			if (allTerrain && allTerrain.length > 0) {
				terrainData = allTerrain[Math.floor(Math.random() * allTerrain.length)];
				Terrain.push(terrainData);
			}
			
			if (terrainData) {
				const { data: terrainEnemies, error: enemyError} = await supabaseClient
				.from("EnemyTable")
				.select("EnemyId, TerrainId, EnemyName, CR, EnemyLootId")
				.eq("TerrainId", terrainData.TerrainId);
				
				
				if (enemyError) throw enemyError;
				
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
		while (totalCR < targetCR && EnemyTable.length > 0 && attempts < 100) {
			attempts++;
			const idx = Math.floor(Math.random() * EnemyTable.length);
			const enemy = EnemyTable[idx];
			if (totalCR + enemy.CR <= targetCR + 1) {
			encounter.push(enemy);
			totalCR += enemy.CR;
			}
		}
		
		encounter.sort((a, b) => {
			if (a.CR !== b.CR) return a.CR - b.CR;
			return a.EnemyName.localeCompare(b.EnemyName);
		});
		
		container.innerHTML = "";
		
		const header = document.createElement('div');
		header.classList.add('gridItem');
		header.style.gridColumn = "1/-1";
		header.innerHTML = `Encounter (Target CR: ${targetCR}):<br>Location: ${Terrain[0].Terrain}`;
		container.appendChild(header);
		
		for (const m of encounter){
			const {data: EnemyLoot} = await supabaseClient
				.from("EnemyLoot")
				.select("EnemyLootId, LootName, LootWeight")
				.eq("EnemyLootId", m.EnemyLootId);
			
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