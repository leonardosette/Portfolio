package com.example.receitafacil.data.local.entity;

import androidx.room.Embedded;
import androidx.room.Relation;

import java.util.List;

/**
 * Carrega uma receita completa com todos os ingredientes e passos.
 * Não é @Entity; serve só como contêiner para consultas com @Transaction.
 */
public class RecipeWithDetails {

    @Embedded
    public Recipe recipe;

    @Relation(
            parentColumn = "id",
            entityColumn = "recipeId",
            entity = Ingredient.class
    )
    public List<Ingredient> ingredients;

    @Relation(
            parentColumn = "id",
            entityColumn = "recipeId",
            entity = Step.class
    )
    public List<Step> steps;
}
