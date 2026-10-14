package com.example.receitafacil.repository;

import android.app.Application;

import androidx.lifecycle.LiveData;

import com.example.receitafacil.data.local.dao.IngredientDao;
import com.example.receitafacil.data.local.dao.RecipeDao;
import com.example.receitafacil.data.local.dao.StepDao;
import com.example.receitafacil.data.local.entity.Ingredient;
import com.example.receitafacil.data.local.entity.Recipe;
import com.example.receitafacil.data.local.entity.RecipeWithDetails;
import com.example.receitafacil.data.local.entity.Step;
import com.example.receitafacil.data.local.AppDatabase;

import java.util.List;

/**
 * Camada que isola os DAOs e fornece uma API única para a UI/ViewModels.
 */
public class RecipeRepository {

    private final RecipeDao recipeDao;
    private final IngredientDao ingredientDao;
    private final StepDao stepDao;
    private final AppExecutors executors = AppExecutors.get();

    public RecipeRepository(Application app) {
        AppDatabase db = AppDatabase.get(app);
        recipeDao     = db.recipeDao();
        ingredientDao = db.ingredientDao();
        stepDao       = db.stepDao();
    }

    /* ------------------- LEITURAS ----------------------------------------- */

    public LiveData<List<Recipe>> getAllRecipes() {
        return recipeDao.loadAll();
    }

    public LiveData<RecipeWithDetails> getRecipe(long id) {
        return recipeDao.loadRecipe(id);
    }

    public LiveData<List<Recipe>> searchByName(String name) {
        return recipeDao.searchByName(name);
    }

    public LiveData<List<Recipe>> searchByIngredient(String ing) {
        return recipeDao.searchByIngredient(ing);
    }

    /* ------------------- ESCRITAS ----------------------------------------- */

    /** Insere receita e devolve o ID via callback na mainThread */
    public void insertRecipe(Recipe recipe, Callback<Long> cb) {
        executors.diskIO().execute(() -> {
            long id = recipeDao.insert(recipe);
            executors.mainThread().execute(() -> cb.onComplete(id));
        });
    }

    /** Atualiza */
    public void updateRecipe(Recipe recipe) {
        executors.diskIO().execute(() -> recipeDao.update(recipe));
    }

    /** Deleta (graças ao ON DELETE CASCADE apaga ingredientes/passos) */
    public void deleteRecipe(Recipe recipe) {
        executors.diskIO().execute(() -> recipeDao.delete(recipe));
    }

    /* ------------------- INGREDIENTES ------------------------------------ */

    public void insertIngredient(Ingredient ing) {
        executors.diskIO().execute(() -> ingredientDao.insert(ing));
    }

    public void updateIngredient(Ingredient ing) {
        executors.diskIO().execute(() -> ingredientDao.update(ing));
    }

    public void deleteIngredient(Ingredient ing) {
        executors.diskIO().execute(() -> ingredientDao.delete(ing));
    }

    /* ------------------- PASSOS ------------------------------------------ */

    public void insertStep(Step step) {
        executors.diskIO().execute(() -> stepDao.insert(step));
    }

    public void updateStep(Step step) {
        executors.diskIO().execute(() -> stepDao.update(step));
    }

    public void deleteStep(Step step) {
        executors.diskIO().execute(() -> stepDao.delete(step));
    }

    /* ------------------- Callback util ----------------------------------- */
    public interface Callback<T> { void onComplete(T result); }
}

