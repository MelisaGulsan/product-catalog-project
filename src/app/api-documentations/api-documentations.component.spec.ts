import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApiDocumentationsComponent } from './api-documentations.component';

describe('ApiDocumentationsComponent', () => {
  let component: ApiDocumentationsComponent;
  let fixture: ComponentFixture<ApiDocumentationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ApiDocumentationsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ApiDocumentationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
