package com.example.receitafacil.data.local;

import android.content.Context;

import androidx.room.Database;
import androidx.room.Room;
import androidx.room.RoomDatabase;

import com.example.receitafacil.data.local.dao.IngredientDao;
import com.example.receitafacil.data.local.dao.RecipeDao;
import com.example.receitafacil.data.local.dao.StepDao;
import com.example.receitafacil.data.local.entity.Ingredient;
import com.example.receitafacil.data.local.entity.Recipe;
import com.example.receitafacil.data.local.entity.Step;

@Database(
        entities = {Recipe.class, Ingredient.class, Step.class},
        version = 1,
        exportSchema = false
)
public abstract class AppDatabase extends RoomDatabase {

    private static volatile AppDatabase INSTANCE;

    public abstract RecipeDao     recipeDao();
    public abstract IngredientDao ingredientDao();
    public abstract StepDao       stepDao();

    public static AppDatabase get(Context ctx) {
        if (INSTANCE == null) {
            synchronized (AppDatabase.class) {
                if (INSTANCE == null) {
                    INSTANCE = Room.databaseBuilder(
                            ctx.getApplicationContext(),
                            AppDatabase.class,
                            "receitafacil.db"
                    ).build();
                }
            }
        }
        return INSTANCE;
    }
}
