package com.example.receitafacil.viewmodel;

import android.app.Application;

import androidx.annotation.NonNull;
import androidx.lifecycle.AndroidViewModel;
import androidx.lifecycle.LiveData;

import com.example.receitafacil.data.local.entity.RecipeWithDetails;
import com.example.receitafacil.repository.RecipeRepository;

public class RecipeDetailViewModel extends AndroidViewModel {

    private final RecipeRepository repo;

    public RecipeDetailViewModel(@NonNull Application app) {
        super(app);
        repo = new RecipeRepository(app);
    }

    public LiveData<RecipeWithDetails> load(long id) {
        return repo.getRecipe(id);
    }
}