package com.example.receitafacil.viewmodel;

import android.app.Application;

import androidx.annotation.NonNull;
import androidx.lifecycle.AndroidViewModel;
import androidx.lifecycle.LiveData;

import com.example.receitafacil.data.local.entity.Recipe;
import com.example.receitafacil.repository.RecipeRepository;

import java.util.List;

public class RecipeListViewModel extends AndroidViewModel {

    private final RecipeRepository repo;
    public final LiveData<List<Recipe>> recipes;

    public RecipeListViewModel(@NonNull Application app) {
        super(app);
        repo     = new RecipeRepository(app);
        recipes  = repo.getAllRecipes();
    }

    public void delete(Recipe r) { repo.deleteRecipe(r); }
}

