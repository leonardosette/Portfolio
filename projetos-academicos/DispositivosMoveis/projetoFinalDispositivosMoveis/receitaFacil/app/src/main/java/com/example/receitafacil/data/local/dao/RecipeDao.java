package com.example.receitafacil.data.local.dao;

import androidx.lifecycle.LiveData;
import androidx.room.Dao;
import androidx.room.Delete;
import androidx.room.Insert;
import androidx.room.Query;
import androidx.room.Transaction;
import androidx.room.Update;

import com.example.receitafacil.data.local.entity.Recipe;
import com.example.receitafacil.data.local.entity.RecipeWithDetails;

import java.util.List;

@Dao
public interface RecipeDao {

    /* CRUD ------------------------------------------------------------------ */

    @Insert
    long insert(Recipe recipe);

    @Update
    void update(Recipe recipe);

    @Delete
    void delete(Recipe recipe);

    /* LEITURAS SIMPLES ------------------------------------------------------- */

    @Query("SELECT * FROM recipe ORDER BY createdAt DESC")
    LiveData<List<Recipe>> loadAll();

    @Query("SELECT * FROM recipe WHERE id = :id LIMIT 1")
    Recipe findByIdSync(long id);

    /* LEITURA COMPLETA (Recipe + ingredientes + passos) --------------------- */

    @Transaction
    @Query("SELECT * FROM recipe WHERE id = :id")
    LiveData<RecipeWithDetails> loadRecipe(long id);

    /* BUSCAS ---------------------------------------------------------------- */

    // Busca por nome (já era string simples)
    @Query("SELECT * FROM recipe WHERE name LIKE '%' || :name || '%'")
    LiveData<List<Recipe>> searchByName(String name);

    // Busca por ingrediente – agora em string concatenada p/ Java 11
    @Query("SELECT r.* FROM recipe r " +
            "JOIN ingredient i ON i.recipeId = r.id " +
            "WHERE i.name LIKE '%' || :ing || '%' " +
            "GROUP BY r.id " +
            "ORDER BY r.name")
    LiveData<List<Recipe>> searchByIngredient(String ing);
}



