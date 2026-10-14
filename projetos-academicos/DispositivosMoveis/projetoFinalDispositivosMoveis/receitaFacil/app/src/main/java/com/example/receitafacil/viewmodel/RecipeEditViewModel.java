package com.example.receitafacil.viewmodel;

import android.app.Application;

import androidx.annotation.NonNull;
import androidx.lifecycle.AndroidViewModel;

import com.example.receitafacil.data.local.entity.Recipe;
import com.example.receitafacil.repository.RecipeRepository;

public class RecipeEditViewModel extends AndroidViewModel {

    private final RecipeRepository repo;

    public RecipeEditViewModel(@NonNull Application app) {
        super(app);
        repo = new RecipeRepository(app);
    }

    public void save(Recipe r) {
        if (r.id == 0) repo.insertRecipe(r, id -> r.id = id);
        else           repo.updateRecipe(r);
    }
}
