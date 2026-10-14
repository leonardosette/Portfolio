package com.example.receitafacil.data.local.dao;

import androidx.lifecycle.LiveData;
import androidx.room.Dao;
import androidx.room.Delete;
import androidx.room.Insert;
import androidx.room.Query;
import androidx.room.Update;

import com.example.receitafacil.data.local.entity.Step;

import java.util.List;

@Dao
public interface StepDao {

    /* CRUD */

    @Insert
    long insert(Step step);

    @Update
    void update(Step step);

    @Delete
    void delete(Step step);

    /* Passos de uma receita (ordenados) */

    @Query("SELECT * FROM step WHERE recipeId = :recipeId ORDER BY `order`")
    LiveData<List<Step>> loadForRecipe(long recipeId);

    /* Limpar todos os passos de uma receita (se precisar resetar) */

    @Query("DELETE FROM step WHERE recipeId = :recipeId")
    void deleteAllForRecipe(long recipeId);
}
