package com.example.receitafacil.data.local.dao;

import androidx.lifecycle.LiveData;
import androidx.room.Dao;
import androidx.room.Delete;
import androidx.room.Insert;
import androidx.room.Query;
import androidx.room.Update;

import com.example.receitafacil.data.local.entity.Ingredient;

import java.util.List;

@Dao
public interface IngredientDao {

    /* CRUD simples */

    @Insert
    long insert(Ingredient ingredient);

    @Update
    void update(Ingredient ingredient);

    @Delete
    void delete(Ingredient ingredient);

    /* Consulta por receita */

    @Query("SELECT * FROM ingredient WHERE recipeId = :recipeId ORDER BY id")
    LiveData<List<Ingredient>> loadForRecipe(long recipeId);

    /* Delete em cascata manual (caso precise) */

    @Query("DELETE FROM ingredient WHERE recipeId = :recipeId")
    void deleteAllForRecipe(long recipeId);
}

