import {Shuffle} from "./Shuffle.js";
import { supabaseClient } from './SupabaseClient.js';

document.addEventListener("DOMContentLoaded", () => {
	const generateBtn = document.getElementById("generate");
	const targetCRInput = document.getElementById("CR");
	const container = document.getElementById('gridContainer');
	const terrainDropdown = document.getElementById('terrainDropdown');
	const damageTypeDropdown = document.getElementById('damageTypeDropdown');
	const monsterTypeDropdown = document.getElementById('monsterTypeDropdown');
	let TerrainId = null;
	let damageId = null;
	let monsterTypeId = null;
	
	initializeDropdowns();
	
	terrainDropdown.addEventListener('change', async () => {
		TerrainId = terrainDropdown.value;
		if (!TerrainId) return;
		
		const { damTer, monTer } = await setTerrain(TerrainId);
		console.log("damTer:", damTer);
		console.log("monTer:", monTer);
		
		const damageOptions = (damTer || []).map(x=> ({ id: x.DamageTypeId, label: `Damage ${x.DamageType.DamageType}` }));
		const monsterOptions = (monTer || []).map(x=> ({ id: x.MonsterTypeId, label: `Monster ${x.MonsterType.MonsterType}` }));
		
		
		damageId = updateDropdownOptions(damageTypeDropdown, damageOptions, damageId);
		monsterTypeId = updateDropdownOptions(monsterTypeDropdown, monsterOptions, monsterTypeId);
	});
	
	damageTypeDropdown.addEventListener('change', async () => {
		damageId = damageTypeDropdown.value;
		if (!damageId) return;
		
		const { terDam, monDam } = await setDamageType(damageId);
		
		const terrainOptions = (terDam || []).map(x=> ({ id: x.TerrainId, label: `Terrain ${x.Terrain.Terrain}` }));
		const monsterOptions = (monDam || []).map(x=> ({ id: x.MonsterTypeId, label: `Monster ${x.MonsterType.MonsterType}` }));
		
		monsterTypeId = updateDropdownOptions(monsterTypeDropdown, monsterOptions, monsterTypeId);
		TerrainId = updateDropdownOptions(terrainDropdown, terrainOptions, TerrainId);
	});
	
	monsterTypeDropdown.addEventListener ('change', async () => {
		monsterTypeId = monsterTypeDropdown.value;
		if (!monsterTypeId) return;
		
		const { damMon, terMon } = await setMonsterType(monsterTypeId);
		
		const terrainOptions = (terMon || []).map(x=> ({ id: x.TerrainId, label: `Terrain ${x.Terrain.Terrain}` }));
		const damageOptions = (damMon || []).map(x=> ({ id: x.DamageTypeId, label: `Damage ${x.DamageType.DamageType}` }));
		
		damageId = updateDropdownOptions(damageTypeDropdown, damageOptions, damageId);		
		TerrainId = updateDropdownOptions(terrainDropdown, terrainOptions, TerrainId);
	});
	
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
		
		let enemyQuery= supabaseClient
			.from("EnemyTable")
			.select(`EnemyId, TerrainId, EnemyName, CR, EnemyLootId, MonsterTypeId, DamageTypeId, Terrain!TerrainId(Terrain)`);
		
		if (monsterTypeId) {
			enemyQuery = enemyQuery.eq("MonsterTypeId", Number(monsterTypeId));
		}
		
		if (damageId) {
			enemyQuery = enemyQuery.eq("DamageTypeId", Number(damageId));
		}
		

		
		const { data: terrainEnemies, error } = await enemyQuery;
		if (error) throw error;
		
		if (TerrainId) {
			terrainData = { Terrain: terrainDropdown.selectedOptions[0].text };
		} else if (EnemyTable.length > 0) {
			terrainData = EnemyTable[0].Terrain;
		} else {
			terrainData = { Terrain: "Unknown" };
		}
		
		
		EnemyTable = terrainEnemies || [];
		EnemyTable = Shuffle(EnemyTable).slice(0,3);
		
		if (!TerrainId && EnemyTable.length > 0) {
			
			const terrainIds = [...new Set(EnemyTable.map(e => e.TerrainId))];
			
			const randomTerrainId = 
				terrainIds[Math.floor(Math.random() * terrainIds.length)];
			
			const { data } = await supabaseClient
				.from("Terrain")
				.select("TerrainId, Terrain")
				.eq("TerrainId", randomTerrainId)
				.single();
				
			terrainData = data;
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
		header.innerHTML = `Encounter (Target CR: ${targetCR}):<br>Location: ${terrainData.Terrain}`;
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

	//function to adjust the other 2 drop down menus after Terrain is selected	
	async function setTerrain(selectedTerrainId) {
		const {data: damTer, error: terrainError} = await supabaseClient
		.from('TerrainDamageTable')
		.select(`DamageTypeId, DamageType!inner(DamageType)`)
		.eq("TerrainId", Number(selectedTerrainId));
		
		if (terrainError) throw new Error(terrainError.message);
		
		const {data: monTer, error: damageError } = await supabaseClient
		.from ('TerrainEnemyTable')
		.select(`MonsterTypeId, MonsterType!inner(MonsterType)`)
		.eq('TerrainId', Number(selectedTerrainId));
		
		if (damageError) throw new Error(damageError.message);	
		
		return { damTer, monTer };
	}
	//function to adjust hte other 2 drop down menus after Damage Type is selected
	async function setDamageType(selectedDamageId) {
		const {data: terDam, error: damageError } = await supabaseClient
		.from('TerrainDamageTable')
		.select(`TerrainId, Terrain!inner(Terrain)`)
		.eq('DamageTypeId', selectedDamageId);
		
		if (damageError) throw new Error(damageError.message);
		
		const {data: monDam, error: monsterError} = await supabaseClient
		.from('DamageMonsterTable')
		.select(`MonsterTypeId, MonsterType!inner(MonsterType)`)
		.eq('DamageTypeId', selectedDamageId);
		
		if (monsterError) throw new Error (monsterError.message);
		
		return { terDam, monDam };
	}
	//function to adjust the other 2 drop down menus after Monster Type is selected
	async function setMonsterType(MonsterTypeId) {
		const {data: damMon, error: damageError } = await supabaseClient
		.from ('DamageMonsterTable')
		.select(`DamageTypeId, DamageType!inner(DamageType)`)
		.eq('MonsterTypeId', MonsterTypeId);
		
		if (damageError) throw new Error(damageError.message);
		
		const {data: terMon, error: terrainError } = await supabaseClient
		.from('TerrainEnemyTable')
		.select(`TerrainId, Terrain!inner(Terrain)`)
		.eq('MonsterTypeId', MonsterTypeId);
		
		if (terrainError) throw new Error (terrainError.message);
		
		return { damMon, terMon };
	}
	
	function populateDropdown(dropdown, options, placeholder = "Select") {
		dropdown.innerHTML = `<option value="">${placeholder}</option>`;
		(options || []).forEach(opt => {
			const option = document.createElement('option');
			option.value = opt.id;
			option.textContent = opt.label;
			dropdown.appendChild(option);
		});
	}
	
	async function initializeDropdowns() {
		const {data: allTerrains, error: terrainError } = await supabaseClient
		.from('Terrain')
		.select('TerrainId, Terrain')
		.order('Terrain'); 
		
		if (terrainError) {
			console.error("Failed to load terrains:", terrainError.message);
			return;
		}
		
		if (!allTerrains || allTerrains.length === 0) {
			console.warn("No terrains found in database.");
			return;
		}
		
		const terrainOptions = allTerrains.map(t => ({ id: t.TerrainId, label: t.Terrain }));
		populateDropdown(terrainDropdown, terrainOptions, "Select Terrain");
		
		const {data: allMonsterTypes, error: monsterError } = await supabaseClient
		.from('MonsterType')
		.select('MonsterTypeId, MonsterType')
		.order('MonsterType');
		
		if (monsterError) {
			console.error("Failed to load monster types:", monsterError.message);
			return;
		}
		
		if (!allMonsterTypes || allMonsterTypes.length === 0) {
			console.warn("No monster types found in database.");
			return;
		}
		
		const monsterOption = allMonsterTypes.map(m => ({ id: m.MonsterTypeId, label: m.MonsterType}));
		populateDropdown(monsterTypeDropdown, monsterOption, "Select Monster Type");
		
		const {data: allDamageTypes, error: damageError } = await supabaseClient
		.from('DamageType')
		.select('DamageTypeId, DamageType')
		.order('DamageType');
		
		if (damageError) {
			console.error("Failed to load damage types:", damageError.message);
			return;
		}
		
		if (!allDamageTypes || allDamageTypes.length === 0) {
			console.warn("No damage types found in database.");
			return;
		}
		
		const damageOption = allDamageTypes.map(d => ({ id: d.DamageTypeId, label: d.DamageType}));
		populateDropdown(damageTypeDropdown, damageOption, "Select Damage Type");
	}
	
	function updateDropdownOptions(dropdown, options, selectedValue) {
		let newSelectedValue = Number(selectedValue);
		
		dropdown.innerHTML = '<option value="">Select...</option>';
		
		options.forEach(opt => {
			const option = document.createElement('option');
			option.value = String(opt.id);
			option.textContent = opt.label;
			
			if (Number(opt.id) === newSelectedValue) {
				option.selected = true;
			}
			
			dropdown.appendChild(option);
		});
		
		return newSelectedValue;
	}
});