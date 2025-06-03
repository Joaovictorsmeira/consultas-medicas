from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0001_initial'),
    ]

    operations = [
        # Criar novo modelo DataDisponivel
        migrations.CreateModel(
            name='DataDisponivel',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('data', models.DateField()),
                ('hora_inicio', models.TimeField()),
                ('hora_fim', models.TimeField()),
                ('ativo', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('medico', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='datas_disponiveis', to='core.perfilmedico')),
            ],
            options={
                'db_table': 'datas_disponiveis',
                'unique_together': {('medico', 'data', 'hora_inicio')},
            },
        ),
        
        # Adicionar campo intervalo_consulta ao PerfilMedico
        migrations.AddField(
            model_name='perfilmedico',
            name='intervalo_consulta',
            field=models.IntegerField(default=30, help_text='Intervalo entre consultas em minutos'),
        ),
        
        # Remover modelo HorarioDisponivel (se existir)
        migrations.RunSQL(
            "DROP TABLE IF EXISTS horarios_disponiveis;",
            reverse_sql="-- Não é possível reverter a remoção da tabela"
        ),
    ]
